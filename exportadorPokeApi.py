import requests
import json
import re
from typing import List, Tuple, Union
import os
import time
import random
import ipaddress
from urllib.parse import urlparse
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ==============================================================================
# 1. CONFIGURAÇÃO
# ==============================================================================

# IDs dos Pokémons a processar (inteiros e/ou intervalos inclusivos)
POKEMON_ID_RANGES: List[Union[int, Tuple[int, int]]] = [
    (152, 1025),  # ajuste conforme necessário
]

# Base canônica da PokéAPI v2
POKEAPI_BASE = "https://pokeapi.co/api/v2/"

# Caminho local para sprites e arquivo JS de saída
ASSETS_DIR = 'assets/sprites/pokemon'
JS_OUTPUT_FILE = 'local_poke_data.js'

# Dicionários de saída
POKE_DATA = {}
SPECIES_DATA = {}
EVOLUTION_CHAINS = {}
EVOLUTION_CHAIN_CACHE = {}  # Evita reprocessar a mesma cadeia

# ==============================================================================
# 2. PROXIES: COLE A LISTA IP:PORTA AQUI (uma por linha), sem esquema e sem auth
# ==============================================================================

PROXIES_TEXT = """
# Exemplo de linhas válidas (cole toda a lista IP:PORTA aqui):
# 103.169.128.158:8080
# 41.32.39.7:3128
# ...
""".strip()

# Também é possível adicionar/mesclar via variável de ambiente PROXY_URLS CSV (opcional)
# Ex.: PROXY_URLS="103.169.128.158:8080,41.32.39.7:3128"

# ==============================================================================
# 3. HTTP: RETRY, BACKOFF E POOL DE SESSÕES
# ==============================================================================

RETRY_STRATEGY = Retry(
    total=3,
    connect=3,
    read=3,
    status=3,
    backoff_factor=0.5,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods={"GET", "HEAD", "OPTIONS"},
    respect_retry_after_header=True,
)  # aplica retentativas idempotentes com backoff exponencial e respeito ao Retry-After [web:19].

DEFAULT_HEADERS = {"User-Agent": "poke-downloader/1.0 (+requests; sticky-proxy)"}
TIMEOUT_SECS = 15
JITTER_RANGE = (0.05, 0.25)
MAX_SESSIONS = 100  # limitar sessões evita abrir conexões demais em proxies públicos instáveis [web:43].

def _is_global_ip(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        return ip.is_global
    except ValueError:
        return False

def _parse_proxies_text(text: str):
    """
    Converte linhas IP:PORTA ou URL em dicts de proxies Requests, mantendo apenas IPs globais e portas válidas 1..65535, e mapeando http/https para http://IP:PORTA por padrão [web:43][web:18].
    """
    proxies = []
    seen = set()
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        scheme = None
        host = None
        port = None

        if "://" in line:
            parsed = urlparse(line)
            scheme = parsed.scheme or "http"
            if ":" in parsed.netloc:
                host, port_str = parsed.netloc.split(":", 1)
                if port_str.isdigit():
                    port = int(port_str)
            else:
                host = parsed.netloc
        else:
            if ":" not in line:
                continue
            host, port_str = line.split(":", 1)
            if port_str.isdigit():
                port = int(port_str)
            scheme = "http"

        if not host or not port:
            continue
        if not (1 <= port <= 65535):
            continue
        if not _is_global_ip(host):
            continue

        proxy_url = f"{scheme}://{host}:{port}"
        key = ("http", proxy_url)
        if key in seen:
            continue
        seen.add(key)
        proxies.append({"http": proxy_url, "https": proxy_url})
    return proxies

# Monta lista de proxies a partir do bloco de texto e da variável de ambiente (opcional)
PROXY_LIST = _parse_proxies_text(PROXIES_TEXT)  # parsing para formato aceito pelo Requests [web:43][web:18].
RAW_PROXY_URLS = os.getenv("PROXY_URLS", "").strip()
if RAW_PROXY_URLS:
    extra = _parse_proxies_text("\n".join([p.strip() for p in RAW_PROXY_URLS.split(",") if p.strip()]))
    PROXY_LIST.extend(extra)  # mescla proxies vindos do ambiente com os colados no arquivo [web:43].

# Limita quantidade de sessões para evitar sobrecarga local e instabilidade
if len(PROXY_LIST) > MAX_SESSIONS:
    PROXY_LIST = random.sample(PROXY_LIST, MAX_SESSIONS)  # amostragem simples para reduzir pool sem viés crítico [web:43].

# Pool de sessões e montagem com Retry
def _build_session(proxy_dict=None):
    s = requests.Session()
    s.headers.update(DEFAULT_HEADERS)
    adapter = HTTPAdapter(max_retries=RETRY_STRATEGY, pool_connections=20, pool_maxsize=20)
    s.mount("http://", adapter)
    s.mount("https://", adapter)
    if proxy_dict:
        s.proxies.update(proxy_dict)
    return s  # reutilizar Session por proxy reduz overhead e mantém conexões persistentes segundo boas práticas do Requests [web:43].

SESSION_POOL = []
SESSION_INDEX = 0  # ponteiro de varredura
ACTIVE_INDEX = None  # índice “sticky” atual

# Saúde dos proxies para cooldown/bloqueio
BLOCK_STATUS = {403, 429, 407}  # 403/429 = bloqueio/reserva, 407 = auth de proxy exigida [web:43].
COOLDOWN_SECONDS = 300  # tempo de resfriamento
MAX_FAILS_BEFORE_COOLDOWN = 2  # falhas transitórias antes do cooldown
HEALTH = []  # lista de dicts: {"fails": int, "cooldown_until": float}

def _ensure_health_size(n):
    global HEALTH
    if len(HEALTH) < n:
        HEALTH = HEALTH + [{"fails": 0, "cooldown_until": 0.0} for _ in range(n - len(HEALTH))]

def _now():
    return time.time()

def _in_cooldown(i):
    return _now() < HEALTH[i]["cooldown_until"]

def _mark_success(i):
    HEALTH[i]["fails"] = 0
    HEALTH[i]["cooldown_until"] = 0.0

def _mark_failure(i, hard=False):
    if hard:
        HEALTH[i]["fails"] = 0
        HEALTH[i]["cooldown_until"] = _now() + COOLDOWN_SECONDS
        return
    HEALTH[i]["fails"] += 1
    if HEALTH[i]["fails"] >= MAX_FAILS_BEFORE_COOLDOWN:
        HEALTH[i]["fails"] = 0
        HEALTH[i]["cooldown_until"] = _now() + COOLDOWN_SECONDS

def init_http():
    """
    Inicializa pool de sessões: uma por proxy + uma sessão direta como fallback, e prepara a saúde/cooldown dos proxies [web:43].
    """
    global SESSION_POOL, ACTIVE_INDEX, HEALTH
    targets = PROXY_LIST[:] if PROXY_LIST else []
    targets.append(None)  # fallback direto sem proxy
    SESSION_POOL = [_build_session(p) for p in targets]
    ACTIVE_INDEX = None
    _ensure_health_size(len(SESSION_POOL))

def http_get(url, stream=False):
    """
    Estratégia “sticky”:
      1) Usa o proxy ativo se estiver saudável, mantendo-o fixo entre chamadas bem-sucedidas.
      2) Em bloqueios (403/429/407) ou falhas de rede, aplica cooldown e tenta próximo.
      3) Em 5xx, trata como falha transitória com troca oportunista.
      4) Se todos falharem, relança a última exceção, com fallback direto incluído na pool [web:43][web:14][web:19].
    """
    global ACTIVE_INDEX, SESSION_INDEX
    last_exc = None
    n = len(SESSION_POOL)
    _ensure_health_size(n)

    time.sleep(random.uniform(*JITTER_RANGE))  # cortesia/jitter entre requisições para reduzir bursts [web:19].

    tried = set()

    def try_index(idx):
        nonlocal last_exc
        sess = SESSION_POOL[idx]
        try:
            resp = sess.get(url, timeout=TIMEOUT_SECS, stream=stream)
            sc = resp.status_code

            if sc in BLOCK_STATUS:
                resp.close()
                _mark_failure(idx, hard=True)
                return None

            if 500 <= sc <= 599:
                resp.close()
                _mark_failure(idx, hard=False)
                return None

            if 400 <= sc <= 499:
                try:
                    resp.raise_for_status()
                except requests.exceptions.RequestException as e:
                    resp.close()
                    last_exc = e
                    _mark_failure(idx, hard=False)
                    return None

            _mark_success(idx)
            return resp

        except requests.exceptions.RequestException as e:
            last_exc = e
            _mark_failure(idx, hard=False)
            return None

    # 1) tenta o ativo se estiver saudável
    if ACTIVE_INDEX is not None and 0 <= ACTIVE_INDEX < n and not _in_cooldown(ACTIVE_INDEX):
        tried.add(ACTIVE_INDEX)
        resp = try_index(ACTIVE_INDEX)
        if resp is not None:
            return resp
        else:
            ACTIVE_INDEX = None

    # 2) tenta os demais, ignorando em cooldown
    for step in range(n):
        idx = (SESSION_INDEX + step) % n
        if idx in tried:
            continue
        if _in_cooldown(idx):
            continue
        resp = try_index(idx)
        if resp is not None:
            ACTIVE_INDEX = idx
            SESSION_INDEX = (idx + 1) % n
            return resp

    # 3) falha geral
    if last_exc:
        raise last_exc
    raise requests.exceptions.RequestException("Todas as sessões falharam sem exceção específica.")

# ==============================================================================
# 4. FUNÇÕES AUXILIARES
# ==============================================================================

def expand_pokemon_ids(ranges: List[Union[int, Tuple[int, int]]]) -> List[int]:
    final_ids = set()
    for item in ranges:
        if isinstance(item, int):
            final_ids.add(item)
        elif isinstance(item, tuple) and len(item) == 2:
            start, end = item
            if start <= end:
                for poke_id in range(start, end + 1):
                    final_ids.add(poke_id)
    return sorted(list(final_ids))

def get_id_from_url(url):
    match = re.search(r'/(\d+)/$', url)
    return int(match.group(1)) if match else None

def fetch_url(url):
    try:
        r = http_get(url, stream=False)
        return r.json()
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar URL {url}: {e}")
        return None

def find_pt_description(flavor_text_entries):
    pt_entry = next((entry for entry in flavor_text_entries if entry['language']['name'] == 'pt'), None)
    if pt_entry:
        return pt_entry['flavor_text'].replace('\n', ' ').replace('\r', ' ')
    en_entry = next((entry for entry in flavor_text_entries if entry['language']['name'] == 'en'), None)
    if en_entry:
        return en_entry['flavor_text'].replace('\n', ' ').replace('\r', ' ')
    return "Descrição não encontrada."

def parse_evolution_chain(chain_data):
    chain = []
    def parse_node(node):
        poke_id = get_id_from_url(node['species']['url'])
        if poke_id:
            chain.append({'id': poke_id, 'name': node['species']['name'].capitalize()})
        if node['evolves_to']:
            parse_node(node['evolves_to'][0])
    parse_node(chain_data)
    if chain:
        EVOLUTION_CHAINS[chain[0]['id']] = chain

def download_sprite(url, filename):
    if not os.path.exists(ASSETS_DIR):
        os.makedirs(ASSETS_DIR)
    local_path = os.path.join(ASSETS_DIR, filename)
    if os.path.exists(local_path):
        return local_path.replace(os.path.sep, '/')
    try:
        r = http_get(url, stream=True)
        with open(local_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        print(f"Download concluído: {local_path}")
        return local_path.replace(os.path.sep, '/')
    except requests.exceptions.RequestException as e:
        print(f"ERRO: Falha ao baixar sprite de {url}. Usando URL externa como fallback. Detalhe: {e}")
        return url

# ==============================================================================
# 5. GERAÇÃO PRINCIPAL DE DADOS
# ==============================================================================

def generate_data():
    POKEMON_IDS = expand_pokemon_ids(POKEMON_ID_RANGES)
    print(f"IDs a serem processados: {POKEMON_IDS}")
    evo_chain_urls = {}
    for poke_id in POKEMON_IDS:
        print(f"Processando Pokémon ID {poke_id}...")
        # A. Pokémon
        poke_url = f"{POKEAPI_BASE}pokemon/{poke_id}"
        poke_data_raw = fetch_url(poke_url)
        # B. Species
        species_url = f"{POKEAPI_BASE}pokemon-species/{poke_id}"
        species_data_raw = fetch_url(species_url)
        if not poke_data_raw or not species_data_raw:
            print(f"Pulando ID {poke_id} devido a erro de busca.")
            continue
        stats = {s['stat']['name'].replace('-', '_'): s['base_stat'] for s in poke_data_raw.get('stats', [])}
        moves = [m['move']['name'] for m in poke_data_raw.get('moves', [])[:4]]
        types = [t['type']['name'] for t in poke_data_raw.get('types', [])]
        # Sprites
        front_url = poke_data_raw.get('sprites', {}).get('front_default')
        back_url = poke_data_raw.get('sprites', {}).get('back_default')
        front_filename = f"{poke_id}_front.png"
        back_filename = f"{poke_id}_back.png"
        local_front_path = download_sprite(front_url, front_filename) if front_url else None
        local_back_path = download_sprite(back_url, back_filename) if back_url else None
        POKE_DATA[poke_id] = {
            "id": poke_id,
            "name": poke_data_raw['name'].capitalize(),
            "front_sprite": local_front_path,
            "back_sprite": local_back_path,
            "stats": stats,
            "moves": moves,
            "types": types,
        }
        SPECIES_DATA[poke_id] = {
            "description": find_pt_description(species_data_raw.get('flavor_text_entries', [])),
            "height": poke_data_raw.get('height'),
            "weight": poke_data_raw.get('weight'),
            "isLegendary": species_data_raw.get('is_legendary'),
            "isMythical": species_data_raw.get('is_mythical'),
        }
        chain_url = species_data_raw['evolution_chain']['url']
        if chain_url not in EVOLUTION_CHAIN_CACHE:
            EVOLUTION_CHAIN_CACHE[chain_url] = None
            evo_chain_urls[poke_id] = chain_url
    # Processa cadeias únicas
    for poke_id, chain_url in evo_chain_urls.items():
        if EVOLUTION_CHAIN_CACHE.get(chain_url) is None:
            print(f"Buscando cadeia de evolução para {chain_url}...")
            evo_data_raw = fetch_url(chain_url)
            if evo_data_raw and 'chain' in evo_data_raw:
                parse_evolution_chain(evo_data_raw['chain'])
                EVOLUTION_CHAIN_CACHE[chain_url] = True

# ==============================================================================
# 6. EXPORTAÇÃO
# ==============================================================================

def export_js_file():
    js_content = f"""// ==================================================
// DADOS GERADOS AUTOMATICAMENTE POR generate_poke_data.py
// ATENÇÃO: ESTE ARQUIVO SERÁ SOBRESCRITO AO EXECUTAR O SCRIPT PYTHON!
// ==================================================

export const POKE_DATA = {json.dumps(POKE_DATA, indent=4, ensure_ascii=False)};

export const SPECIES_DATA = {json.dumps(SPECIES_DATA, indent=4, ensure_ascii=False)};

export const EVOLUTION_CHAINS = {json.dumps(EVOLUTION_CHAINS, indent=4, ensure_ascii=False)};
"""
    try:
        with open(JS_OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print("\n" + "="*50)
        print(f"SUCESSO: O arquivo '{JS_OUTPUT_FILE}' foi atualizado.")
        print("Lembre-se de rodar o script para baixar os sprites em 'assets/sprites'.")
        print("="*50 + "\n")
    except Exception as e:
        print(f"\nERRO FATAL ao escrever no arquivo JS: {e}")
        print("Certifique-se de que o script tem permissão para escrever em 'local_poke_data.js'.")

# ==============================================================================
# 7. MAIN
# ==============================================================================

if __name__ == "__main__":
    init_http()  # prepara pool, inclui fallback direto e zera o estado “sticky” [web:43].
    generate_data()  # consulta endpoints canônicos /pokemon/{id}, /pokemon-species/{id} e segue evolution_chain da species conforme v2 [web:16][web:20].
    # Exporto auxiliar para inspeção / debugging
    output_filename = 'poke_data_exports.txt'
    with open(output_filename, 'w', encoding='utf-8') as f:
        f.write("="*50 + "\n")
        f.write("DADOS GERADOS PARA local_poke_data.js\n")
        f.write("COPIE E COLE O CONTEÚDO NO ARQUIVO local_poke_data.js\n")
        f.write("CERTIFIQUE-SE DE TER BAIXADO AS IMAGENS NA PASTA 'assets/sprites' ANTES DE USAR.\n")
        f.write("="*50 + "\n\n")
        f.write("export const POKE_DATA = " + json.dumps(POKE_DATA, indent=4, ensure_ascii=False) + ";\n\n")
        f.write("export const SPECIES_DATA = " + json.dumps(SPECIES_DATA, indent=4, ensure_ascii=False) + ";\n\n")
        f.write("export const EVOLUTION_CHAINS = " + json.dumps(EVOLUTION_CHAINS, indent=4, ensure_ascii=False) + ";\n")
    export_js_file()  # gera local_poke_data.js com os dados estruturados prontos para uso em front-end [web:43].

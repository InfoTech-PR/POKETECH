import requests
import json
import re
from typing import List, Tuple, Union
import os 

# ==============================================================================
# 1. CONFIGURAÇÃO
# ==============================================================================

# Defina os Pokémons usando IDs únicos ou intervalos (start_id, end_id).
# A lista original (1, 9), 13, (14, 15), (16, 18), 25, 26 não cobria Raticate, etc.
# Expandi o intervalo para incluir os Pokémons que você tinha na sua Pokédex local
# até o ID 28.
POKEMON_ID_RANGES: List[Union[int, Tuple[int, int]]] = [
    (1, 151),    # Bulbasaur (1) até Butterfree (12)
]

POKEAPI_BASE = "https://pokeapi.co/api/v2/"

# NOVO: Configuração do caminho de assets
ASSETS_DIR = 'assets/sprites'
# NOVO: Arquivo de saída JavaScript
JS_OUTPUT_FILE = 'local_poke_data.js'

# Dicionários de saída
POKE_DATA = {}
SPECIES_DATA = {}
EVOLUTION_CHAINS = {}
EVOLUTION_CHAIN_CACHE = {} # Usado para evitar reprocessamento da mesma cadeia

# ==============================================================================
# 2. FUNÇÕES AUXILIARES
# ==============================================================================

def expand_pokemon_ids(ranges: List[Union[int, Tuple[int, int]]]) -> List[int]:
    """Expande a lista de IDs ou intervalos para uma lista plana e única de IDs."""
    final_ids = set()
    for item in ranges:
        if isinstance(item, int):
            final_ids.add(item)
        elif isinstance(item, tuple) and len(item) == 2:
            start, end = item
            # Garante que o intervalo é válido
            if start <= end:
                for poke_id in range(start, end + 1):
                    final_ids.add(poke_id)
        
    return sorted(list(final_ids))

def get_id_from_url(url):
    """Extrai o ID do Pokémon ou espécie a partir de uma URL da PokéAPI."""
    match = re.search(r'/(\d+)/$', url)
    return int(match.group(1)) if match else None

def fetch_url(url):
    """Faz a chamada HTTP com tratamento de erro."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar URL {url}: {e}")
        return None

def find_pt_description(flavor_text_entries):
    """Encontra a primeira descrição em Português ou, como fallback, em Inglês."""
    
    # 1. Busca por Português
    pt_entry = next((entry for entry in flavor_text_entries if entry['language']['name'] == 'pt'), None)
    if pt_entry:
        # Limpa quebras de linha e retornos de carro
        return pt_entry['flavor_text'].replace('\n', ' ').replace('\r', ' ')
        
    # 2. Fallback para Inglês
    en_entry = next((entry for entry in flavor_text_entries if entry['language']['name'] == 'en'), None)
    if en_entry:
        return en_entry['flavor_text'].replace('\n', ' ').replace('\r', ' ')
        
    return "Descrição não encontrada."

def parse_evolution_chain(chain_data):
    """Analisa recursivamente a estrutura aninhada da cadeia de evolução."""
    
    chain = []
    
    def parse_node(node):
        # Extrai o ID
        poke_id = get_id_from_url(node['species']['url'])
        if poke_id:
            chain.append({
                'id': poke_id,
                'name': node['species']['name'].capitalize()
            })
        
        # Assume o primeiro da lista de evoluções
        if node['evolves_to']:
            parse_node(node['evolves_to'][0])
            
    parse_node(chain_data)
    
    # Mapeia a cadeia para o ID do Pokémon base (primeiro da lista)
    if chain:
        EVOLUTION_CHAINS[chain[0]['id']] = chain

def download_sprite(url, filename):
    """Baixa um sprite e salva-o localmente."""
    if not os.path.exists(ASSETS_DIR):
        os.makedirs(ASSETS_DIR)
        
    local_path = os.path.join(ASSETS_DIR, filename)
    
    # Verifica se o arquivo já existe para evitar downloads repetidos
    if os.path.exists(local_path):
        # CORREÇÃO 1: Garante que o caminho de retorno use barras normais (/)
        return local_path.replace(os.path.sep, '/')
        
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Download concluído: {local_path}")
        # CORREÇÃO 1: Garante que o caminho de retorno use barras normais (/)
        return local_path.replace(os.path.sep, '/')
    except requests.exceptions.RequestException as e:
        print(f"ERRO: Falha ao baixar sprite de {url}. Usando URL externa como fallback. Detalhe: {e}")
        # Retorna o URL externo como fallback em caso de falha no download
        return url 

# ==============================================================================
# 3. GERAÇÃO PRINCIPAL DE DADOS
# ==============================================================================

def generate_data():
    """Busca os dados de todos os IDs, baixa sprites e popula os dicionários."""
    
    # Gera a lista final de IDs a partir dos intervalos
    POKEMON_IDS = expand_pokemon_ids(POKEMON_ID_RANGES)
    print(f"IDs a serem processados: {POKEMON_IDS}")

    # Mapeia a URL da cadeia de evolução para o ID do Pokémon para processamento posterior
    evo_chain_urls = {}
    
    for poke_id in POKEMON_IDS:
        print(f"Processando Pokémon ID {poke_id}...")

        # --- A. Fetch Data (Pokemon) ---
        poke_url = f"{POKEAPI_BASE}pokemon/{poke_id}"
        poke_data_raw = fetch_url(poke_url)
        
        # --- B. Fetch Data (Species) ---
        species_url = f"{POKEAPI_BASE}pokemon-species/{poke_id}"
        species_data_raw = fetch_url(species_url)
        
        if not poke_data_raw or not species_data_raw:
            print(f"Pulando ID {poke_id} devido a erro de busca.")
            continue

        # 1. Popula POKE_DATA
        stats = {
            s['stat']['name'].replace('-', '_'): s['base_stat'] 
            for s in poke_data_raw['stats']
        }
        moves = [
            m['move']['name'] 
            for m in poke_data_raw['moves'][:4]
        ]
        types = [
            t['type']['name'] 
            for t in poke_data_raw['types']
        ]

        # --- Download e Caminhos Locais dos Sprites ---
        front_url = poke_data_raw['sprites']['front_default']
        back_url = poke_data_raw['sprites']['back_default']
        
        front_filename = f"{poke_id}_front.png"
        back_filename = f"{poke_id}_back.png"
        
        # Realiza o download e armazena o nome do arquivo ou o URL de fallback
        local_front_path = download_sprite(front_url, front_filename) if front_url else None
        local_back_path = download_sprite(back_url, back_filename) if back_url else None

        
        POKE_DATA[poke_id] = {
            "id": poke_id,
            "name": poke_data_raw['name'].capitalize(),
            # O caminho retornado já está com barras normais (/)
            "front_sprite": local_front_path, 
            "back_sprite": local_back_path, 
            "stats": stats,
            "moves": moves,
            "types": types,
        }
        
        # 2. Popula SPECIES_DATA
        SPECIES_DATA[poke_id] = {
            "description": find_pt_description(species_data_raw['flavor_text_entries']),
            "height": poke_data_raw['height'], # dm
            "weight": poke_data_raw['weight'], # hg
            "isLegendary": species_data_raw['is_legendary'],
            "isMythical": species_data_raw['is_mythical'],
        }
        
        # 3. Mapeia a URL da cadeia de evolução
        chain_url = species_data_raw['evolution_chain']['url']
        if chain_url not in EVOLUTION_CHAIN_CACHE:
             EVOLUTION_CHAIN_CACHE[chain_url] = None # Placeholder para evitar busca duplicada
             evo_chain_urls[poke_id] = chain_url
    
    # Processa as cadeias de evolução únicas
    for poke_id, chain_url in evo_chain_urls.items():
        # Verifica se o ID do Pokémon atual já foi mapeado por uma evolução anterior (ex: se Charizard já foi processado ao buscar Charmander)
        is_already_processed = any(chain_url == url and EVOLUTION_CHAIN_CACHE[url] for url in EVOLUTION_CHAIN_CACHE)
        
        if EVOLUTION_CHAIN_CACHE[chain_url] is None:
            print(f"Buscando cadeia de evolução para {chain_url}...")
            evo_data_raw = fetch_url(chain_url)
            if evo_data_raw:
                parse_evolution_chain(evo_data_raw['chain'])
                EVOLUTION_CHAIN_CACHE[chain_url] = True # Marca como processado

# ==============================================================================
# 4. EXPORTAÇÃO
# ==============================================================================

def export_js_file():
    """Gera o arquivo local_poke_data.js com os dados formatados."""
    
    js_content = f"""// ==================================================
// DADOS GERADOS AUTOMATICAMENTE POR generate_poke_data.py
// ATENÇÃO: ESTE ARQUIVO SERÁ SOBRESCRITO AO EXECUTAR O SCRIPT PYTHON!
// ==================================================

export const POKE_DATA = {json.dumps(POKE_DATA, indent=4, ensure_ascii=False)};

export const SPECIES_DATA = {json.dumps(SPECIES_DATA, indent=4, ensure_ascii=False)};

export const EVOLUTION_CHAINS = {json.dumps(EVOLUTION_CHAINS, indent=4, ensure_ascii=False)};
"""
    
    try:
        # Tenta escrever no arquivo JS de saída
        with open(JS_OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(js_content)
        
        print("\n" + "="*50)
        print(f"SUCESSO: O arquivo '{JS_OUTPUT_FILE}' foi atualizado.")
        print("Lembre-se de rodar o script para baixar os sprites em 'assets/sprites'.")
        print("="*50 + "\n")
        
    except Exception as e:
        print(f"\nERRO FATAL ao escrever no arquivo JS: {e}")
        print("Certifique-se de que o script tem permissão para escrever em 'local_poke_data.js'.")

if __name__ == "__main__":
    generate_data()
    
    # Gera o arquivo poke_data_exports.txt (mantido para debugging e visualização)
    output_filename = 'poke_data_exports.txt'
    with open(output_filename, 'w', encoding='utf-8') as f:
        f.write("="*50 + "\n")
        f.write("DADOS GERADOS PARA local_poke_data.js\n")
        f.write("COPIE E COLE O CONTEÚDO NO ARQUIVO local_poke_data.js\n")
        f.write("CERTIFIQUE-SE DE TER BAIXADO AS IMAGENS NA PASTA 'assets/sprites' ANTES DE USAR.\n")
        f.write("="*50 + "\n\n")

        # Escreve POKE_DATA
        f.write("export const POKE_DATA = " + json.dumps(POKE_DATA, indent=4, ensure_ascii=False) + ";\n\n")

        # Escreve SPECIES_DATA
        f.write("export const SPECIES_DATA = " + json.dumps(SPECIES_DATA, indent=4, ensure_ascii=False) + ";\n\n")

        # Escreve EVOLUTION_CHAINS
        f.write("export const EVOLUTION_CHAINS = " + json.dumps(EVOLUTION_CHAINS, indent=4, ensure_ascii=False) + ";\n")

    # NOVO: Chama a função que salva diretamente no arquivo JS
    export_js_file()
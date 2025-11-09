/**
 * poke_friendship.js
 * Sistema de Amizades Pokémon
 * Permite criar, aceitar e listar amizades entre perfis autenticados.
 */

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Importa GameLogic para garantir que os dados sejam salvos.
import { GameLogic } from './game_logic.js';

const refreshFriendshipScreen = () => {
  if (
    window.gameState?.currentScreen === "friendshipMenu" &&
    window.Renderer?.renderFriendshipMenu
  ) {
    const app = document.getElementById("app-container");
    if (app) {
      window.Renderer.renderFriendshipMenu(app);
    }
  }
};

export const PokeFriendship = {
  /**
   * Obtém o ID da sala de chat (baseado no UID dos dois usuários, ordenado para ser único).
   * @param {string} userAId
   * @param {string} userBId
   * @returns {string} ID da sala
   */
  getChatRoomId: function (userAId, userBId) {
    const sortedIds = [userAId, userBId].sort();
    return sortedIds.join('_');
  },

  /**
   * Cria um pedido de amizade e retorna o ID da solicitação para ser usado no link.
   * @returns {Promise<string|null>} O ID do documento da amizade (solicitação), ou null em caso de erro.
   */
  createFriendRequestDocument: async function (targetUserId) {
    if (!window.userId || !window.db) {
      window.Utils.showModal("errorModal", "Usuário não autenticado ou banco indisponível.");
      return null;
    }

    if (targetUserId === window.userId) {
      window.Utils.showModal("errorModal", "Você não pode enviar um pedido de amizade para si mesmo.");
      return null;
    }

    // 1. Verifica se já existe (amizade ativa ou pendente)
    const q = query(
      collection(window.db, "friendships"),
      where("participants", "array-contains", window.userId)
    );
    const snapshot = await getDocs(q);

    let existingDoc = null;
    snapshot.docs.forEach((d) => {
      const data = d.data();
      if (data.participants.includes(targetUserId)) {
        existingDoc = d;
      }
    });

    if (existingDoc) {
      const status = existingDoc.data().status;
      if (status === 'accepted') {
        window.Utils.showModal("infoModal", "Você já é amigo(a) deste jogador.");
      } else {
        window.Utils.showModal("infoModal", "Você já tem uma solicitação pendente com este jogador.");
      }
      return null;
    }

    try {
      // 2. Cria a solicitação com status PENDENTE e retorna o ID
      const newFriendshipRef = await addDoc(collection(window.db, "friendships"), {
        participants: [window.userId, targetUserId],
        status: "pending",
        requester: window.userId,
        createdAt: Timestamp.now(),
      });

      return newFriendshipRef.id;
    } catch (error) {
      console.error("Erro ao criar documento de pedido de amizade:", error);
      window.Utils.showModal("errorModal", "Falha ao criar o pedido de amizade.");
      return null;
    }
  },

  /**
   * Processa o aceite da amizade via URL, atualizando o status para 'accepted'.
   * @param {string} friendshipId - ID do documento da amizade na coleção 'friendships'.
   */
  processFriendshipAcceptance: async function (friendshipId) {
    if (!window.userId || !window.db) {
      return { success: false, message: "Você precisa estar logado para aceitar a amizade." };
    }

    const ref = doc(window.db, "friendships", friendshipId);
    const docSnap = await getDoc(ref);

    if (!docSnap.exists()) {
      return { success: false, message: "O link de amizade é inválido ou expirou." };
    }

    const data = docSnap.data();

    // 1. Verifica se o usuário atual é o destinatário (e não o remetente)
    // O destinatário deve ser um dos participantes E não o requisitante.
    const isRecipient = data.participants.includes(window.userId) && data.requester !== window.userId;

    if (!isRecipient) {
      return { success: false, message: "Você não é o destinatário desta solicitação. Já aceitou ou não era para você." };
    }

    // 2. Se já for aceita, apenas informa
    if (data.status === "accepted") {
      return { success: true, message: "Vocês já são amigos!" };
    }

    // 3. Atualiza o status
    try {
      await updateDoc(ref, {
        status: "accepted",
        acceptedAt: Timestamp.now()
      });
      refreshFriendshipScreen();
      return { success: true, message: "Amizade estabelecida com sucesso! Vocês já podem batalhar!" };
    } catch (error) {
      console.error("Erro ao aceitar pedido via URL:", error);
      return { success: false, message: "Erro ao atualizar o status da amizade." };
    }
  },

  /**
   * Envia um pedido de amizade para outro jogador e retorna o link.
   * @param {string} targetUserId - ID do usuário de destino.
   */
  sendFriendRequest: async function (targetUserId) {
    const friendshipId = await PokeFriendship.createFriendRequestDocument(targetUserId);

    if (friendshipId) {
      // Retorna o link para exibição
      const newUrl = `${window.location.origin}${window.location.pathname}?friend=${friendshipId}`;
      return { success: true, message: `Pedido criado! Compartilhe este link:`, link: newUrl };
    }
    return { success: false, message: "Falha ao criar pedido ou amizade já existe." };
  },


  /**
   * Aceita um pedido de amizade pendente.
   * @param {string} friendshipId - ID do documento da amizade.
   */
  acceptFriendRequest: async function (friendshipId) {
    try {
      const ref = doc(window.db, "friendships", friendshipId);
      await updateDoc(ref, { status: "accepted" });
      window.Utils.showModal("infoModal", "Pedido de amizade aceito!");
      refreshFriendshipScreen();
    } catch (error) {
      console.error("Erro ao aceitar pedido:", error);
      window.Utils.showModal("errorModal", "Erro ao aceitar amizade.");
    }
  },

  /**
   * Remove um amigo ou cancela um pedido pendente.
   * @param {string} friendshipId - ID do documento da amizade.
   */
  removeFriendship: async function (friendshipId) {
    try {
      await deleteDoc(doc(window.db, "friendships", friendshipId));
      window.Utils.showModal("infoModal", "Amizade removida.");
      refreshFriendshipScreen();
    } catch (error) {
      console.error("Erro ao remover amizade:", error);
      window.Utils.showModal("errorModal", "Erro ao remover amizade.");
    }
  },

  /**
   * Lista todos os amigos e solicitações do usuário atual.
   * @returns {Promise<Array>} Lista de amizades
   */
  listFriendships: async function () {
    try {
      const q = query(
        collection(window.db, "friendships"),
        where("participants", "array-contains", window.userId)
      );
      const snapshot = await getDocs(q);
      const friendships = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      return friendships;
    } catch (error) {
      console.error("Erro ao listar amizades:", error);
      // CORREÇÃO DE ROBUSTEZ: Lança o erro para que a função showFriendListModal possa tratá-lo
      throw error;
    }
  },

  /**
   * Mostra um modal simples com a lista de amizades.
   */
  showFriendListModal: async function () {
    let friendships = [];
    let errorEncountered = false;

    try {
      // CORRIGIDO: Usa o nome explícito da classe em vez de 'this' para evitar perda de contexto.
      friendships = await PokeFriendship.listFriendships();
    } catch (e) {
      // Se o Firebase deu erro, mostra uma mensagem clara de segurança
      if (e.code === "permission-denied" || e.code === "unauthenticated") {
        window.Utils.showModal("errorModal", "Erro de Segurança do Banco de Dados. Verifique as Regras do Firebase (Firestore).");
        return;
      }
      errorEncountered = true;
    }

    if (errorEncountered) {
      window.Utils.showModal("errorModal", "Falha Crítica ao carregar amizades. Verifique o console para mais detalhes.");
      return;
    }


    let html = "";
    if (friendships.length === 0) {
      html = `<p class="text-sm text-gray-700 gba-font">Nenhuma amizade encontrada.</p>`;
    } else {
      // O mapeamento Promise.all está correto para buscar nomes de amigos
      html = await Promise.all(friendships.map(async (f) => {
        const friendId = f.participants.find((id) => id !== window.userId);
        const docRef = doc(window.db, "users", friendId);
        const docSnap = await getDoc(docRef);
        // Usa o ID como fallback se o doc de usuário não existir
        const friendName = docSnap.exists() ? docSnap.data().trainerName : friendId;

        const isMeTheRequester = f.requester === window.userId;

        let statusText = "";
        let actions = "";

        if (f.status === "pending") {
          statusText = `<span class='text-yellow-600'>(Pendente: ${isMeTheRequester ? 'Aguardando aceite' : 'Ação Necessária'})</span>`;

          if (!isMeTheRequester) {
            actions = `<button class="gba-button bg-green-500 hover:bg-green-600 mt-1" onclick="window.PokeFriendship.acceptFriendRequest('${f.id}')">Aceitar</button>`;
          } else {
            // A função resendLinkModal precisa ser implementada se não estiver (coloquei no último código completo)
            actions = `<button class="gba-button bg-blue-500 hover:bg-blue-600 mt-1" onclick="window.PokeFriendship.resendLinkModal('${f.id}', '${friendId}')">Compartilhar Link</button>`;
          }
          actions += `<button class="gba-button bg-red-500 hover:bg-red-600 mt-1 ml-2" onclick="window.PokeFriendship.removeFriendship('${f.id}')">Cancelar</button>`;

        } else {
          statusText = `<span class='text-green-600'>(Amigo)</span>`;
          actions = `
                        <button class="gba-button bg-purple-500 hover:bg-purple-600 mt-1" 
                                onclick="window.Utils.hideModal('infoModal'); window.MapCore.openFriendInteraction('${friendId}', '${friendName}')">
                                Interagir (Mapa)
                        </button>
                        <button class="gba-button bg-red-500 hover:bg-red-600 mt-1 ml-2" 
                                onclick="window.PokeFriendship.removeFriendship('${f.id}')">Remover</button>`;
        }

        return `
                    <div class="border-b border-gray-400 py-2">
                        <div class="text-xs text-gray-800 gba-font">${friendName}</div>
                        <div class="text-xs">${statusText}</div>
                        <div class="mt-2 flex space-x-2">${actions}</div>
                    </div>
                `;
      }))
        .join("");
    }

    const modalBody = document.querySelector("#infoModal .modal-message");
    const titleAndInput = `
            <div class="text-lg font-bold text-gray-800 gba-font mb-4">AMIZADES</div>
            <input id="friendIdInput" type="text" placeholder="ID do Amigo para Gerar Link" class="w-full p-2 border-2 border-gray-800 rounded gba-font text-sm text-center bg-white shadow-inner">
            <button onclick="window.PokeFriendship.requestLinkGeneration(document.getElementById('friendIdInput').value.trim())" 
                    class="gba-button bg-blue-500 hover:bg-blue-600 w-full mt-2 mb-4">
              Gerar Link de Amizade
            </button>
            <div class="text-left">${html}</div>
        `;

    modalBody.innerHTML = titleAndInput;
    // CORREÇÃO FINAL: Passa uma string vazia ("") para a função showModal.
    // Isso evita que ela sobrescreva o conteúdo que acabamos de injetar 
    // com uma mensagem padrão como "INFORMACOES".
    window.Utils.showModal("infoModal", "");
  },

  /**
   * Solicita a criação de link e lida com o modal de resposta.
   */
  requestLinkGeneration: async function (targetUserId) {
    if (!targetUserId) {
      window.Utils.showModal("errorModal", "Digite o ID do amigo para gerar o link.");
      return;
    }

    // Esconde o modal atual para mostrar o de processamento
    window.Utils.hideModal("infoModal");

    const result = await PokeFriendship.sendFriendRequest(targetUserId);

    if (result.success && result.link) {
      const modalMessage = `
                ${result.message}
                <input id="friendLink" type="text" value="${result.link}" readonly 
                       class="w-full p-1 mt-2 mb-2 text-xs border border-gray-300 rounded gba-font" 
                       onclick="this.select(); document.execCommand('copy'); window.Utils.showModal('infoModal', 'Link copiado!');">
                <button onclick="document.getElementById('friendLink').select(); document.execCommand('copy'); window.Utils.showModal('infoModal', 'Link copiado!');" 
                        class="gba-button bg-green-500 hover:bg-green-600 w-full mt-2">
                    Copiar Link
                </button>
            `;
      window.Utils.showModal("infoModal", modalMessage);
    } else {
      window.Utils.showModal(result.success ? "infoModal" : "errorModal", result.message);
    }
  },

  /**
   * Exibe o link novamente no modal (para pedidos pendentes enviados).
   */
  resendLinkModal: async function (friendshipId, targetUserId) {
    const newUrl = `${window.location.origin}${window.location.pathname}?friend=${friendshipId}`;
    const modalMessage = `
            <p class="gba-font text-xs mb-2">Re-enviar link para ${targetUserId}:</p>
            <input id="friendLink" type="text" value="${newUrl}" readonly 
                   class="w-full p-1 mt-2 mb-2 text-xs border border-gray-300 rounded gba-font" 
                   onclick="this.select(); document.execCommand('copy'); window.Utils.showModal('infoModal', 'Link copiado!');">
            <button onclick="document.getElementById('friendLink').select(); document.execCommand('copy'); window.Utils.showModal('infoModal', 'Link copiado!');" 
                    class="gba-button bg-green-500 hover:bg-green-600 w-full mt-2">
                Copiar Link
            </button>
        `;
    window.Utils.showModal("infoModal", modalMessage);
  },
};

// Exporta globalmente (para uso nos onclicks no HTML)
window.PokeFriendship = window.PokeFriendship || PokeFriendship;
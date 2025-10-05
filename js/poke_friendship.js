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

export const PokeFriendship = {
  /**
   * Envia um pedido de amizade para outro jogador.
   * @param {string} targetUserId - ID do usuário de destino.
   */
  sendFriendRequest: async function (targetUserId) {
    if (!window.userId || !window.db) {
      window.Utils.showModal("errorModal", "Usuário não autenticado ou banco indisponível.");
      return;
    }

    if (targetUserId === window.userId) {
      window.Utils.showModal("errorModal", "Você não pode enviar um pedido de amizade para si mesmo.");
      return;
    }

    try {
      // Evita duplicar pedidos já existentes
      const q = query(
        collection(window.db, "friendships"),
        where("participants", "array-contains", window.userId)
      );
      const snapshot = await getDocs(q);
      const alreadyExists = snapshot.docs.some((d) => {
        const data = d.data();
        return data.participants.includes(targetUserId);
      });

      if (alreadyExists) {
        window.Utils.showModal("infoModal", "Você já tem amizade ou solicitação pendente com este jogador.");
        return;
      }

      await addDoc(collection(window.db, "friendships"), {
        participants: [window.userId, targetUserId],
        status: "pending",
        requester: window.userId,
        createdAt: Timestamp.now(),
      });

      window.Utils.showModal("infoModal", "Pedido de amizade enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar pedido de amizade:", error);
      window.Utils.showModal("errorModal", "Falha ao enviar pedido de amizade.");
    }
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
      return [];
    }
  },

  /**
   * Mostra um modal simples com a lista de amizades.
   */
  showFriendListModal: async function () {
    const friendships = await this.listFriendships();

    let html = "";
    if (friendships.length === 0) {
      html = `<p class="text-sm text-gray-700 gba-font">Nenhuma amizade encontrada.</p>`;
    } else {
      html = friendships
        .map((f) => {
          const friendId = f.participants.find((id) => id !== window.userId);
          const statusText =
            f.status === "pending"
              ? "<span class='text-yellow-600'>(Pendente)</span>"
              : "<span class='text-green-600'>(Ativa)</span>";

          const actions =
            f.status === "pending" && f.requester !== window.userId
              ? `<button class="gba-button bg-green-500 hover:bg-green-600 mt-1" onclick="window.PokeFriendship.acceptFriendRequest('${f.id}')">Aceitar</button>`
              : `<button class="gba-button bg-red-500 hover:bg-red-600 mt-1" onclick="window.PokeFriendship.removeFriendship('${f.id}')">Remover</button>`;

          return `
            <div class="border-b border-gray-400 py-2">
              <div class="text-xs text-gray-800 gba-font">${friendId}</div>
              <div class="text-xs">${statusText}</div>
              ${actions}
            </div>
          `;
        })
        .join("");
    }

    const modalBody = document.querySelector("#infoModal .modal-message");
    modalBody.innerHTML = `<div class="text-left">${html}</div>`;
    window.Utils.showModal("infoModal");
  },
};

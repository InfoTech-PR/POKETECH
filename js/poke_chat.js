/**
 * poke_chat.js
 * Módulo para gerenciar a funcionalidade de chat ponto a ponto entre amigos.
 */

import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Armazena o listener de chat para desinscrição
let unsubscribeChat = null;

export const PokeChat = {

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
     * Inicia o chat e renderiza a interface do modal.
     * @param {string} friendId - ID do amigo
     * @param {string} friendName - Nome do amigo
     */
    startChat: async function (friendId, friendName) {
        if (!window.db || !window.userId) {
            window.Utils.showModal("errorModal", "Você precisa estar logado para usar o chat.");
            return;
        }

        const roomId = PokeChat.getChatRoomId(window.userId, friendId);

        // 1. Renderiza o modal de chat
        const chatModal = document.getElementById("chatModal");
        const chatContent = document.getElementById("chatContent");
        const chatTitle = document.getElementById("chatFriendName");
        const sendButton = document.getElementById("sendChatMessageBtn");
        const messageInput = document.getElementById("chatMessageInput");

        if (!chatModal || !chatContent || !chatTitle || !sendButton || !messageInput) {
            window.Utils.showModal("errorModal", "Erro: Elementos do modal de chat não encontrados.");
            return;
        }

        chatTitle.textContent = friendName;
        chatContent.innerHTML = '<p class="text-center text-xs gba-font text-gray-500">Carregando mensagens...</p>';

        // Habilita o botão de envio e seta o handler
        sendButton.onclick = () => {
            PokeChat.sendMessage(roomId, messageInput.value.trim());
            messageInput.value = ''; // Limpa o input após enviar
        };

        chatModal.classList.remove("hidden");

        // 2. Inicia o listener em tempo real
        PokeChat.listenForMessages(roomId, chatContent);
    },

    /**
     * Envia uma mensagem para a sala de chat.
     * @param {string} roomId - ID da sala de chat
     * @param {string} message - Conteúdo da mensagem
     */
    sendMessage: async function (roomId, message) {
        if (!message) return;

        const messagesRef = collection(window.db, "chats", roomId, "messages");

        // Adiciona a mensagem
        await addDoc(messagesRef, {
            senderId: window.userId,
            senderName: window.gameState.profile.trainerName || window.userId,
            text: message,
            timestamp: Timestamp.now(),
        });

        // Rola para o final
        const chatContent = document.getElementById("chatContent");
        if (chatContent) chatContent.scrollTop = chatContent.scrollHeight;
    },

    /**
     * Configura um listener em tempo real para novas mensagens.
     * @param {string} roomId - ID da sala de chat
     * @param {HTMLElement} chatContentElement - Elemento onde as mensagens são exibidas
     */
    listenForMessages: function (roomId, chatContentElement) {
        // 1. Desinscreve o listener anterior, se houver
        if (unsubscribeChat) {
            unsubscribeChat();
            unsubscribeChat = null;
        }

        const messagesRef = collection(window.db, "chats", roomId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"), limit(50));

        // 2. Inicia a escuta em tempo real (onSnapshot)
        unsubscribeChat = onSnapshot(q, (snapshot) => {
            let messagesHtml = "";
            snapshot.forEach((doc) => {
                const data = doc.data();
                const isMe = data.senderId === window.userId;
                const time = data.timestamp instanceof Timestamp
                    ? data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '...';

                messagesHtml += `
          <div class="flex ${isMe ? 'justify-end' : 'justify-start'} mb-2">
            <div class="max-w-[75%] p-2 rounded-lg shadow-sm text-sm ${isMe ? 'bg-blue-300 text-gray-800' : 'bg-gray-200 text-gray-800'}">
              <span class="gba-font text-[8px] ${isMe ? 'text-blue-700' : 'text-orange-700'}">${data.senderName} (${time}):</span>
              <p class="text-xs break-words mt-1">${data.text}</p>
            </div>
          </div>
        `;
            });
            chatContentElement.innerHTML = messagesHtml;

            // Rola para o final da conversa
            chatContentElement.scrollTop = chatContentElement.scrollHeight;
        });

        console.log(`[CHAT] Listener iniciado para sala: ${roomId}`);
    },

    /**
     * NOVO: Fecha o modal de chat e limpa o listener.
     */
    closeChat: function () {
        if (unsubscribeChat) {
            unsubscribeChat();
            unsubscribeChat = null;
            console.log("[CHAT] Listener de chat desinscrito.");
        }
        window.Utils.hideModal("chatModal");
    }
};

// Exporta o fechar chat globalmente para o botão do modal
window.closeChat = PokeChat.closeChat;

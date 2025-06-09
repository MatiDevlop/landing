'use strict';

import { fetchFakerData } from './functions.js';

/**
 * Renderiza las primeras tres cards en el contenedor con id "skeleton-container" usando TailwindCSS v4.
 * 
 * @param {Array<{title: string, author: string, genre: string, content: string}>} items - Arreglo de objetos con los datos de las cards.
 * @returns {void}
 */
const renderCards = (items) => {
    const container = document.getElementById('skeleton-container');
    if (!container) {
        console.error('No se encontró el elemento con id "skeleton-container".');
        return;
    }
    container.innerHTML = ''; // Limpiar el contenedor

    items.slice(0, 3).forEach(({ title, author, genre, content }) => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md p-6 mb-4 max-w-md mx-auto';
        card.innerHTML = `
            <h2 class="text-xl font-bold mb-2">${title}</h2>
            <p class="text-gray-600 mb-1"><span class="font-semibold">Autor:</span> ${author}</p>
            <p class="text-gray-500 mb-2"><span class="font-semibold">Género:</span> ${genre}</p>
            <p class="text-gray-700">${content}</p>
        `;
        container.appendChild(card);
    });
};

/**
 * Obtiene datos de la API de Faker y renderiza las cards en caso de éxito.
 * 
 * @async
 * @function
 * @returns {Promise<void>}
 */
const loadData = async () => {
    const url = 'https://fakerapi.it/api/v2/texts?_quantity=10&_characters=120';

    try {
        const result = await fetchFakerData(url);

        if (result.success) {
            console.log('Datos obtenidos con éxito:', result.body);
            renderCards(result.body.data);
        } else {
            console.error('Error al obtener los datos:', result.error);
        }
    } catch (error) {
        console.error('Ocurrió un error inesperado:', error);
    }
};

(() => {
    loadData();
})();
'use strict';

/**
 * Realiza una petición fetch a la URL proporcionada y retorna un objeto con el resultado.
 *
 * @param {string} url - URL de la API a la que se realizará la petición.
 * @returns {Promise<{success: boolean, body?: any, error?: string}>} Promesa que resuelve con el resultado de la petición.
 */
let fetchFakerData = (url) => {
    return fetch(url)
        .then(response => {
            // Verificar si la respuesta es exitosa (status 200-299)
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Respuesta exitosa
            return {
                success: true,
                body: data
            };
        })
        .catch(error => {
            return {
                success: false,
                error: `Error en la petición: ${error.message}`
            };
        });
}

export { fetchFakerData }
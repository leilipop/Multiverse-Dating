
// URL de base de l'API
const API_URL = 'https://rickandmortyapi.com/api/character';

// Variables globales pour stocker l'état
let candidatsActuels = [];  
let mesMatchs = [];          
let indexActuel = 0;         
let nextPageUrl = null;     

// Compteurs de statistiques
let compteurLikes = 0;
let compteurPass = 0;


// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function() {
    // Charger les données sauvegardées
    loadMatchs();
    loadStatistiques();
    
    // Ajouter les écouteurs d'événements
    setupEventListeners();
});


function setupEventListeners() {
    // Formulaire de recherche
    const searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', handleSearch);
    
    // Boutons d'action
    const btnPass = document.getElementById('passBtn');
    const btnLike = document.getElementById('likeBtn');
    btnPass.addEventListener('click', () => swipeCard('pass'));
    btnLike.addEventListener('click', () => swipeCard('like'));
    
    // Bouton charger plus
    const btnLoadMore = document.getElementById('loadMoreBtn');
    btnLoadMore.addEventListener('click', chargerPlusDeProfiles);
    
    // Modal
    const btnClose = document.getElementById('closeModal');
    const modal = document.getElementById('characterModal');
    btnClose.addEventListener('click', () => modal.close());
}


/**
 * Gère la soumission du formulaire
 * Construit l'URL et lance la recherche
 */
function handleSearch(event) {
    // Empêcher le rechargement de la page
    event.preventDefault();
    
    const nom = document.getElementById('nameInput').value;
    const statut = document.getElementById('statusSelect').value;
    const genre = document.getElementById('genderSelect').value;
    
    const params = new URLSearchParams();
    
    // Ajouter les paramètres seulement s'ils ne sont pas vides
    if (nom) params.append('name', nom);
    if (statut) params.append('status', statut);
    if (genre) params.append('gender', genre);
    
    // Construire l'URL complète
    const searchUrl = API_URL + (params.toString() ? '?' + params.toString() : '');
    console.log('URL de recherche:', searchUrl);
    
    // Lancer la recherche
    fetchCharacters(searchUrl);
}

/**
 * Récupère les personnages depuis l'API
 * Utilise async/await pour gérer la promesse
 */
async function fetchCharacters(url) {
    try {
        // Faire la requête fetch
        const response = await fetch(url);
        
        // Vérifier si la réponse est OK
        if (!response.ok) {
            // Cas spécial : 404 = aucun personnage trouvé
            if (response.status === 404) {
                afficherMessage('😢 Personne dans cette dimension', 'Aucun personnage ne correspond à vos critères.');
                return;
            }
            throw new Error('Erreur lors de la recherche');
        }
        
        const data = await response.json();
        
        candidatsActuels = data.results;
        indexActuel = 0;
        
        nextPageUrl = data.info.next;
        
        displayCurrentCard();
        
        document.getElementById('actionButtons').style.display = 'flex';
        
        document.getElementById('loadMoreBtn').style.display = nextPageUrl ? 'block' : 'none';
        
    } catch (error) {
        console.error('Erreur:', error);
        afficherMessage('❌ Erreur', 'Impossible de récupérer les personnages. Réessayez.');
    }
}

/**
 * Affiche le personnage actuel
 */
function displayCurrentCard() {
    // Vérifier qu'il reste des personnages
    if (indexActuel >= candidatsActuels.length) {
        afficherFinDeck();
        return;
    }
    
    // Récupérer le personnage actuel
    const character = candidatsActuels[indexActuel];
    
    // Créer le HTML de la carte
    const carteHTML = `
        <div class="character-card">
            <img src="${character.image}" alt="${character.name}" class="card-image">
            <div class="card-content">
                <h2 class="card-name">${character.name}</h2>
                <div>
                    <span class="badge ${character.status.toLowerCase()}">${character.status}</span>
                    <span class="badge">${character.species}</span>
                    <span class="badge">${character.gender}</span>
                </div>
                <div class="card-info">
                    <p><strong>🌍 Origine:</strong> ${character.origin.name}</p>
                    <p><strong>📍 Localisation:</strong> ${character.location.name}</p>
                </div>
            </div>
        </div>
    `;
    
    // Insérer la carte dans le DOM
    document.getElementById('deckContainer').innerHTML = carteHTML;
}


function swipeCard(action) {
    // Récupérer le personnage actuel
    const personnage = candidatsActuels[indexActuel];
    
    // Récupérer l'élément de la carte
    const carte = document.querySelector('.character-card');
    
    if (action === 'like') {
        // Ajouter aux matchs
        ajouterAuxMatchs(personnage);
        
        carte.classList.add('swipe-right');
        
        compteurLikes++;
        
    } else if (action === 'pass') {
        carte.classList.add('swipe-left');
        
        compteurPass++;
    }
    
    // Mettre à jour les statistiques
    updateStats();
    
    // Passer au personnage suivant après l'animation
    setTimeout(() => {
        indexActuel++;
        displayCurrentCard();
    }, 500);
}

/**
 * Ajoute un personnage aux matchs
 */
function ajouterAuxMatchs(personnage) {
    // Vérifier que le personnage n'est pas déjà dans les matchs
    const existe = mesMatchs.find(match => match.id === personnage.id);
    
    if (!existe) {
        // Ajouter le personnage
        mesMatchs.push(personnage);
        
        sauvegarderMatchs();
        
        // Mettre à jour l'affichage
        afficherListeMatchs();
    }
}

/**
 * Sauvegarde les matchs dans le localStorage
 */
function sauvegarderMatchs() {
    localStorage.setItem('myMatches', JSON.stringify(mesMatchs));
}


function loadMatchs() {
    // Récupérer la chaîne JSON
    const stored = localStorage.getItem('myMatches');
    
    if (stored) {
        mesMatchs = JSON.parse(stored);
        
        afficherListeMatchs();
    }
}

/**
 * Affiche la liste des matchs
 */
function afficherListeMatchs() {
    const container = document.getElementById('matchesList');
    
    // Si aucun match
    if (mesMatchs.length === 0) {
        container.innerHTML = '<p class="no-matches">Aucun match pour le moment</p>';
        document.getElementById('matchCount').textContent = '0';
        return;
    }
    
    // Créer le HTML pour chaque match
    let html = '';
    mesMatchs.forEach(match => {
        html += `
            <div class="match-item" onclick="showDetails(${match.id})">
                <img src="${match.image}" alt="${match.name}" class="match-avatar">
                <div class="match-name">${match.name}</div>
                <button class="match-remove" onclick="event.stopPropagation(); supprimerMatch(${match.id})">×</button>
            </div>
        `;
    });
    
    container.innerHTML = html;
    document.getElementById('matchCount').textContent = mesMatchs.length;
}

/**
 * Supprime un match
 */
function supprimerMatch(characterId) {
    // Filtrer le tableau pour retirer le personnage
    mesMatchs = mesMatchs.filter(match => match.id !== characterId);
    
    sauvegarderMatchs();
    afficherListeMatchs();
}
/**
 * Charge plus de profils depuis la page suivante
 */
async function chargerPlusDeProfiles() {
    // Vérifier qu'il y a une page suivante
    if (!nextPageUrl) return;
    
    try {
        // Faire la requête
        const response = await fetch(nextPageUrl);
        const data = await response.json();
        
        // Ajouter les nouveaux personnages au tableau
        candidatsActuels = candidatsActuels.concat(data.results);
        
        // Mettre à jour l'URL de pagination
        nextPageUrl = data.info.next;
        
        // Masquer le bouton si plus de pages
        document.getElementById('loadMoreBtn').style.display = nextPageUrl ? 'block' : 'none';
        
        // Si on était à la fin, afficher la nouvelle carte
        if (indexActuel >= candidatsActuels.length - data.results.length) {
            displayCurrentCard();
            document.getElementById('actionButtons').style.display = 'flex';
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible de charger plus de profils');
    }
}

// ========================================
// JOUR 5 : MODAL DE DÉTAILS
// ========================================

/**
 * Affiche les détails d'un personnage dans une modal
 */
async function showDetails(characterId) {
    try {
        // Chercher le personnage dans les matchs
        let personnage = mesMatchs.find(match => match.id === characterId);
        
        // Si pas trouvé, faire une requête API
        if (!personnage) {
            const response = await fetch(`${API_URL}/${characterId}`);
            personnage = await response.json();
        }
        
        // Remplir la modal
        document.getElementById('modalImage').src = personnage.image;
        document.getElementById('modalName').textContent = personnage.name;
        document.getElementById('modalStatus').textContent = personnage.status;
        document.getElementById('modalSpecies').textContent = personnage.species;
        document.getElementById('modalGender').textContent = personnage.gender;
        document.getElementById('modalOrigin').textContent = personnage.origin.name;
        document.getElementById('modalLocation').textContent = personnage.location.name;
        document.getElementById('modalEpisodes').textContent = personnage.episode ? personnage.episode.length : 'N/A';
        
        // Ouvrir la modal
        document.getElementById('characterModal').showModal();
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible de charger les détails');
    }
}

// ========================================
// GESTION DES STATISTIQUES
// ========================================

/**
 * Met à jour l'affichage des statistiques
 */
function updateStats() {
    document.getElementById('likeCounter').textContent = compteurLikes;
    document.getElementById('passCounter').textContent = compteurPass;
    
    sauvegarderStats();
}

/**
 * Sauvegarde les statistiques
 */
function sauvegarderStats() {
    const stats = {
        likes: compteurLikes,
        passes: compteurPass
    };
    localStorage.setItem('stats', JSON.stringify(stats));
}

/**
 * Charge les statistiques
 */
function loadStatistiques() {
    const stored = localStorage.getItem('stats');
    if (stored) {
        const stats = JSON.parse(stored);
        compteurLikes = stats.likes || 0;
        compteurPass = stats.passes || 0;
        updateStats();
    }
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Affiche un message à l'utilisateur
 */
function afficherMessage(titre, texte) {
    const html = `
        <div class="welcome">
            <h3>${titre}</h3>
            <p>${texte}</p>
        </div>
    `;
    document.getElementById('deckContainer').innerHTML = html;
    document.getElementById('actionButtons').style.display = 'none';
    document.getElementById('loadMoreBtn').style.display = 'none';
}

/**
 * Affiche le message de fin de deck
 */
function afficherFinDeck() {
    const message = nextPageUrl 
        ? 'Cliquez sur "Charger plus" pour continuer !' 
        : 'Lancez une nouvelle recherche pour trouver plus de personnages.';
    
    afficherMessage('🎉 Fin du deck !', message);
}

// ========================================
// BONUS : RACCOURCIS CLAVIER
// ========================================

document.addEventListener('keydown', function(e) {
    // Ignorer si on tape dans un input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        return;
    }
    
    // Flèche gauche = Pass
    if (e.key === 'ArrowLeft') {
        document.getElementById('passBtn').click();
    }
    
    // Flèche droite = Like
    if (e.key === 'ArrowRight') {
        document.getElementById('likeBtn').click();
    }
});

console.log('✅ Application initialisée !');
console.log('💡 Astuce : Utilisez les flèches du clavier pour swiper !');


import { request } from "./src/services/api.js";

const listeArticles = document.getElementById("liste-articles");
const recherche = document.getElementById("recherche");
const filterStatus = document.getElementById("filtre-status");
const tri = document.getElementById("tri");
const formArticle = document.getElementById("form-article");
const titreInput = document.getElementById("titre");
const descriptionInput = document.getElementById("description");
const prixInput = document.getElementById("prix");
const titleError = document.getElementById("titreErreur");
const descriptionError = document.getElementById("descriptionErreur");
const priceError = document.getElementById("prixErreur");
const btnAjouter = document.getElementById("button-ajouter");
const formMessage = document.getElementById("form-message");

let allArticles = [];

async function tester() {
    try {
        const data = await request("/articles");
        allArticles = data
        afficherArticles(data);
    } catch (error) {
        console.log(error);
    }
}

tester();

function afficherArticles(articles){
    listeArticles.replaceChildren();
    articles.forEach(article => {
        const articleDiv = document.createElement("div");
        articleDiv.classList.add("container");

        const titre = document.createElement("h3");
        titre.textContent = article.title;
        titre.dataset.id = article.id;
        titre.classList.add("titles");

        const description = document.createElement("p");
        description.textContent = article.description;
        description.classList.add("descriptions");

        const prix = document.createElement("p");
        prix.textContent = `${article.prix} MAD`;
        prix.classList.add("prices");

        const status = document.createElement("p");
        status.textContent = article.statut;
        status.classList.add("status");

        const date = document.createElement("p");
        date.textContent = article.date;
        date.classList.add("dates");

        articleDiv.append(titre, description, prix, status, date);
        listeArticles.append(articleDiv);
    });
}

async function afficherDetails(id){
    try{
        const article = await request(`/articles/${id}`);
    }
    catch(error){
        console.log(error);
    }
}

function appliquerFiltres(){
    let result = [...allArticles];

    const nom = recherche.value.trim().toLowerCase();

    result = result.filter(article =>
        article.title.toLowerCase().includes(nom)
    );

    const status = filterStatus.value;

    result = result.filter(article =>
        status === "tous" || article.statut === status
    );

    const triInput = tri.value;

    result.sort((a, b) => {
        if (triInput === "title") {
            return a.title.localeCompare(b.title);
        }
        else if (triInput === "prix") {
            return a.prix - b.prix;
        }
        else if (triInput === "date") {
            return new Date(a.date) - new Date(b.date);
        }
    });
    afficherArticles(result);
}

listeArticles.addEventListener("click", event => {
    const titre = event.target.closest(".titles");
    if(titre){
        afficherDetails(titre.dataset.id);
    }
});

recherche.addEventListener("input", () => {
    appliquerFiltres();
});

filterStatus.addEventListener("change", () => {
    appliquerFiltres();
});

tri.addEventListener("change", () => {
    appliquerFiltres();
});

formArticle.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = titreInput.value.trim();
    const description = descriptionInput.value.trim();
    const prix = Number(prixInput.value);
    if(title.length < 3 || title.length > 80){
        titleError.textContent = "Le titre doit etre entre 3 et 80 caractères !";
        titleError.classList.remove("hidden");
    }
    else{
        titleError.classList.add("hidden");
    }
    
    if(description.length < 10){
        descriptionError.textContent = "La description doit contient au moins 10 caractères";
        descriptionError.classList.remove("hidden");
    }
    else{
        descriptionError.classList.add("hidden");
    }

    if(prix <= 0 || !Number.isFinite(prix)){
        priceError.textContent = "Le prix ne doit etre strictement positif";
        priceError.classList.remove("hidden");
    }
    else{
        priceError.classList.add("hidden");
    }
    if (title.length < 3 || title.length > 80 || description.length < 10 || prix <= 0 || !Number.isFinite(prix)){
        return;
    }
    const newArticle = {
        title: title,
        description: description,
        prix: prix,
        statut: "Disponible",
        date: new Date().toISOString().split("T")[0]
    };
    btnAjouter.disabled = true;
    btnAjouter.textContent = "Ajout en cours...";
    try {
    const data = await request("/articles", {
        method: "POST",
        body: JSON.stringify(newArticle)
    });
    allArticles.unshift(data);
    afficherArticles(allArticles);
    formMessage.textContent = "Article ajouté avec succès !";
    formMessage.classList.remove("hidden");
    } catch (error) {
        console.log(error);
        formMessage.textContent = `Erreur : ${error.message}`;
        formMessage.classList.remove("hidden");
    }
    finally {
        btnAjouter.disabled = false;
        btnAjouter.textContent = "Ajouter l'article";
    }
});

titreInput.addEventListener("input", () => {
    if (titreInput.value.trim().length >= 3 && titreInput.value.trim().length <= 80) {
        titleError.classList.add("hidden");
    }
});

descriptionInput.addEventListener("input", () => {
    if (descriptionInput.value.trim().length >= 10) {
        descriptionError.classList.add("hidden");
    }
});

prixInput.addEventListener("input", () => {
    const prix = Number(prixInput.value);

    if (prix > 0 && Number.isFinite(prix)) {
        priceError.classList.add("hidden");
    }
});
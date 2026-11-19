

import { request } from "./src/services/api.js";

const listeArticles = document.getElementById("liste-articles");
const recherche = document.getElementById("recherche");
const filterStatus = document.getElementById("filtre-status");
const tri = document.getElementById("tri");

let allArticles = [];

async function tester() {
    try {
        const data = await request("/articles");
        allArticles = data
        console.log(data);
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
        console.log(article);
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
// const apiKey = "ga_live_vW0GfdNw2QjoMW65Ib0-VITYBnjR8S07m5f2fBPS";
const cards = document.getElementById("cards");
const metalTemplate = document.getElementById("metalTemplate");
const selectDevise = document.getElementById("devise");
const selectMetal = document.getElementById("metal-select");
const selectRange = document.getElementById("range-select");
const historyChart = document.getElementById("history-chart");
const poids = document.getElementById("poids");
const metalEstimateur = document.getElementById("metal-estimateur");
const resultatEstimation = document.getElementById("resultat-estimation");
const statusMessage = document.getElementById("status-message");
const retryButton = document.getElementById("retry-button");
let derniereDevise = selectDevise.value;

const deviseSauvegardee = localStorage.getItem("devise");

if (deviseSauvegardee) {
    selectDevise.value = deviseSauvegardee;
}

function afficherEtat(message, etat) {
    statusMessage.textContent = message;
    statusMessage.className = etat;

    retryButton.hidden = etat !== "erreur";
    retryButton.disabled = etat === "chargement";
    selectDevise.disabled = etat === "chargement";
    selectMetal.disabled = etat === "chargement";
    selectRange.disabled = etat === "chargement";
}

let typeDerniereRequete = "";

async function getApi(devise){
    typeDerniereRequete = "api";
    if(!navigator.onLine){
        afficherEtat("Vous êtes hors ligne.", "erreur");
        throw new Error("Vous êtes hors ligne.");
    }
    afficherEtat("Chargement...", "chargement");
    derniereDevise = devise;
    const apiUrl = `https://xaus.com/api/v1/spot?currency=${devise}`;
    let response;

    try {
        response = await fetch(apiUrl);
    } catch (error) {
        afficherEtat("Erreur réseau. Vérifiez votre connexion.", "erreur");
        throw new Error("Erreur réseau.");
    }
    if(!response.ok){
        if(response.status === 429) {
            afficherEtat("Quota dépassé. Réessayez plus tard.", "erreur");
        }
        else if(response.status >= 500) {
            afficherEtat("Erreur serveur : " + response.status, "erreur");
        }
        else{
            afficherEtat("Erreur client : " + response.status, "erreur");
        }
            throw new Error("Erreur HTTP : " + response.status);
    }
    let data;
    try{
        data = await response.json();
    }
    catch(error){
        afficherEtat("Réponse JSON illisible.", "erreur");
        throw new Error("Réponse JSON illisible.");
    }
    afficherEtat("Données chargées avec succès", "succes");
    return data;
}

function calculerVariation(points){
    
    if(points.length < 2) {
        return null;
    }

    const dernierPoint = points[points.length - 1];
    const apresDernier = points[points.length - 2];
    const prixActuelle = dernierPoint.c;
    const prixPrecedent = apresDernier.c;
        
    const variation = prixActuelle - prixPrecedent;
    const pourcentage = (variation / prixPrecedent) * 100;
    let sens;

    if(variation > 0){
        sens = "hausse";
    }
    else if(variation < 0){
        sens = "baisse";
    }
    else{
        sens = "stable";
    }
    return {
        variation: variation,
        pourcentage: pourcentage,
        sens: sens
    };
}


async function getPoints(symbole, range){
    typeDerniereRequete = "historique";
    afficherEtat("Chargement...", "chargement");

    if(!navigator.onLine){
        afficherEtat("Vous êtes hors ligne.", "erreur");
        throw new Error("Vous êtes hors ligne.");
    }

    const url = `https://xaus.com/api/v1/chart?symbol=${symbole}&range=${range}&interval=1d`

    let response;

    try {
        response = await fetch(url);
    }catch (error) {
        afficherEtat("Erreur réseau. Vérifiez votre connexion.", "erreur");
        throw new Error("Erreur réseau.");
    }
    
    if(!response.ok){
        if(response.status === 429) {
            afficherEtat("Quota dépassé. Réessayez plus tard.", "erreur");
        }
        else if(response.status >= 500) {
            afficherEtat("Erreur serveur : " + response.status, "erreur");
        }
        else{
            afficherEtat("Erreur client : " + response.status, "erreur");
        }
            throw new Error("Erreur HTTP : " + response.status);
    }
        let data;

    try{
        data = await response.json();
    }catch(error) {
        afficherEtat("Réponse JSON illisible.", "erreur");
        throw new Error("Réponse JSON illisible.");
    }
    afficherEtat("Données chargées avec succès", "succes");
    return data;
}

let dernierSymbole = "";
let dernierRange = "";

async function afficherHistorique(){
    const symbole = selectMetal.value;
    const range = selectRange.value;

    dernierSymbole = symbole;
    dernierRange = range;

    const data = await getPoints(symbole, range);

    const context = historyChart.getContext("2d");
    context.clearRect(0, 0, historyChart.width, historyChart.height);
    if (data.points.length === 0) {
        context.fillText("Aucune donnée disponible", 20, 30);
        return;
    }
    historyChart.width = 600;
    historyChart.height = 300;
    const espace = historyChart.width / data.points.length;
    const prix = data.points.map(point => point.c);

    const prixMin = Math.min(...prix);
    const prixMax = Math.max(...prix);

    const hauteur = historyChart.height - 40;
    const difference = prixMax - prixMin;
    context.beginPath();
    data.points.forEach((point, index) => {
        const x = index * espace;
        const y = difference === 0 ? historyChart.height / 2 : historyChart.height - 20 - ((point.c - prixMin) / difference) * hauteur;
        if(index === 0){
            context.moveTo(x, y);
        }
        else{
            context.lineTo(x, y);
        }
        if (data.points.length === 1) {
            context.arc(x, y, 4, 0, Math.PI * 2);
            context.fill();
        }
    });
    context.stroke();
}
selectMetal.addEventListener("change", afficherHistorique);
selectRange.addEventListener("change", afficherHistorique); 
afficherHistorique();


function afficherVariation(carte, result, fx_rate){
    if(result === null){
        carte.querySelector(".metal-variation").textContent = "Données insuffisantes";
        carte.querySelector(".metal-percentage").textContent = "";
        return;
    }

    const variationConvertie = (result.variation * fx_rate) / 31.1034768;
    carte.querySelector(".metal-variation").textContent = result.sens === "hausse" ? "↑ " + variationConvertie.toFixed(2) : result.sens === "baisse" ? "↓ " + variationConvertie.toFixed(2) : "→ " + variationConvertie.toFixed(2);
    carte.querySelector(".metal-percentage").textContent = result.pourcentage.toFixed(2) + "%";

    if(result.sens === "hausse"){
            carte.querySelector(".metal-variation").style.color = "green";
            carte.querySelector(".metal-percentage").style.color = "green"
        }
        else if(result.sens === "baisse"){
            carte.querySelector(".metal-variation").style.color = "red";
            carte.querySelector(".metal-percentage").style.color = "red";
        }
        else{
            carte.querySelector(".metal-variation").style.color = "gray";
            carte.querySelector(".metal-percentage").style.color = "gray";
        }
}

const variations = {};
const prixParGramme = {};
try {
    const data = await getApi(selectDevise.value);
    const metaux = [
        {
            symbole: "xau",
            nom: "or",
            prix: data.xau.price,
            devise: data.xau.currency
        },
        {
            symbole: "silver",
            nom: "argent",
            prix: data.silver_usd_oz * data.fx_rate,
            devise: data.xau.currency
        }
    ];
    for (const metal of metaux) {
        const clone = metalTemplate.content.cloneNode(true);
        const carte = clone.querySelector(".metal-card");
        carte.id = metal.symbole;
        carte.querySelector(".metal-name").textContent = metal.nom;
        carte.querySelector(".metal-price").textContent = "Prix : " + (metal.prix / 31.1034768).toFixed(2) + " " + metal.devise + " /g";
        carte.querySelector(".metal-update").textContent = "Mise à jour le : " + data.updated_at.split("T")[0] + " " + data.updated_at.split("T")[1].split(".")[0];
        cards.appendChild(clone);
        const historique = await getPoints(metal.symbole, "1mo");
        prixParGramme[metal.symbole] = metal.prix / 31.1034768;
        const resultat = calculerVariation(historique.points);
        variations[metal.symbole] = resultat;
        afficherVariation(carte, resultat, data.fx_rate);
    }
} catch (error) {
    alert(error.message);
}

async function reessayerRequete() {
    const data = await getApi(selectDevise.value);
    prixParGramme.xau = data.xau.price / 31.1034768;
    prixParGramme.silver = (data.silver_usd_oz * data.fx_rate) / 31.1034768;
    const carteOr = document.getElementById("xau");
    const carteArgent = document.getElementById("silver");
    carteOr.querySelector(".metal-price").textContent =
    "Prix : " + (data.xau.price / 31.1034768).toFixed(2) + " " + data.xau.currency + " /g";

    carteArgent.querySelector(".metal-price").textContent =
    "Prix : " + ((data.silver_usd_oz * data.fx_rate) / 31.1034768).toFixed(2) + " " + data.xau.currency + " /g";

    afficherVariation(carteOr, variations.xau, data.fx_rate);
    afficherVariation(carteArgent, variations.silver, data.fx_rate);

    calculerEstimation();
}

retryButton.addEventListener("click", async function() {
    try {
        if (typeDerniereRequete === "historique") {
        await afficherHistorique();
    }
    else {
        await reessayerRequete();
    }
    } catch (error) {
        alert(error.message);
    }
});

selectDevise.addEventListener("change", async function(){
    try {
        const data = await getApi(selectDevise.value);
        prixParGramme.xau = data.xau.price / 31.1034768;
        prixParGramme.silver = (data.silver_usd_oz * data.fx_rate) / 31.1034768;
        localStorage.setItem("devise", selectDevise.value);
        const carteOr = document.getElementById("xau");
        const carteArgent = document.getElementById("silver");

        carteOr.querySelector(".metal-price").textContent =
        "Prix : " + (data.xau.price / 31.1034768).toFixed(2) + " " + data.xau.currency + " /g";

        carteArgent.querySelector(".metal-price").textContent =
        "Prix : " + ((data.silver_usd_oz * data.fx_rate) / 31.1034768).toFixed(2) + " " + data.xau.currency + " /g";

        afficherVariation(carteOr, variations.xau, data.fx_rate);
        afficherVariation(carteArgent, variations.silver, data.fx_rate);
        calculerEstimation();
    } catch(error) {
        alert(error.message);
    }
});

function calculerEstimation() {
    const valeurPoids = Number(poids.value);
    const metal = metalEstimateur.value;

    if (poids.value.trim() === "" || !Number.isFinite(valeurPoids) || valeurPoids <= 0) {
        resultatEstimation.textContent = "Veuillez saisir un poids valide.";
        return;
    }

    const prix = valeurPoids * prixParGramme[metal];

    resultatEstimation.textContent =
        "Estimation : " + prix.toFixed(2) + " " + selectDevise.value;
}
poids.addEventListener("input", calculerEstimation);
metalEstimateur.addEventListener("change", calculerEstimation);
const BASE_URL = "http://localhost:3001";
export async function request(path, options = {}){
    const controller = new AbortController();
    const timeout = setTimeout(() =>{
        controller.abort();
    },8000);
    const Url = `${BASE_URL}${path}`;
    try{
        const response = await fetch(Url, {...options,
            headers :{
                "Content-Type" : "application/json",
                ...options.headers
            },
            signal : controller.signal
        });
        if(!response.ok){
            throw{
                type: "http",
                status: response.status,
                message: `HTTP error : ${response.status}`
            }
        }
        const data = await response.json();
        return data;
    }catch(error){
        if(error.name === "AbortError"){
            throw{
                type: "timeout",
                status: null,
                message: "La requête a dépassé le délai de 8 secondes" 
            };
        }
        if(error.type === "http"){
            throw error
        }
        if(error instanceof SyntaxError){
            throw{
                type: "parse",
                status: null,
                message: "Impossible de lire les données JSON"
            };
        }
        if(!navigator.onLine){
            throw{
                type: "offline",
                status: null,
                message: "Aucune connexion Internet"
            };
        }
        throw{
            type: "network",
            status: null,
            message: error.message
        }
    }finally{
        clearTimeout(timeout);
    }
}
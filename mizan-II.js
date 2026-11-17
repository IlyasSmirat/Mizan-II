import { request } from "./src/services/api.js";

async function tester() {
    try {
        const data = await request("/posts");
        console.log(data);
    } catch (error) {
        console.log(error);
    }
}

tester();

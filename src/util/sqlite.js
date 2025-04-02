import Database from '@tauri-apps/plugin-sql';
// when using `"withGlobalTauri": true`, you may use
// const Database = window.__TAURI__.sql;

async function getDb() {
    const db = await Database.load('sqlite:json.db');
    return db;
}
async function queryJSONData() {
    const db = await getDb();
    const result = await db.select("SELECT * FROM json_data");
    return result;
}

async function addJSONData(name, data) {
    const db = await getDb();
    let dateObject = new Date();
    let year = dateObject.getFullYear()
    let month = dateObject.getMonth() + 1;
    let day = dateObject.getDay();
    let date = `${year}-${month}-${day}`
    let result = await db.execute("INSERT INTO json_data (name, json, date) VALUES ($1, $2, $3)", [name, data, date]);
    return result
}

export default {
    getDb, queryJSONData, addJSONData
}

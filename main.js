const express = require('express');
const mysql = require('mysql2');

const createConnection = (db = 'hgcentral') => mysql.createConnection({
    host: 'genome-euro-mysql.soe.ucsc.edu',
    port: 3306,
    user: 'genome',
    database: db,
});

const app = express();

app.get('/species', (req, res) => {
    const connection = createConnection();
    connection.query(`
        SELECT 
            a.name, a.genome
        FROM
            hgcentral.dbDb AS a
                JOIN
            information_schema.tables AS b ON b.table_schema = a.name
        AND b.table_name = 'ncbiRefSeq';`, (err, result) => {
        connection.end();
        res.json({ err, result });
    });
});

app.get('/species/:species/genes', (req, res) => {
    const { species } = req.params;
    const connection = createConnection(species);
    connection.query(`SELECT name2 AS gene, count(*) AS variantCount FROM ncbiRefSeq GROUP BY name2`, (err, result) => {
        connection.end();

        res.json({ err, result });
    })
});

app.get('/species/:species/genes/:gene/variants', (req, res) => {
    const { species, gene } = req.params;
    const connection = createConnection(species);
    connection.query(`SELECT * FROM ncbiRefSeq WHERE name2=?`, gene,(err, result) => {
        connection.end();
        const map = (points) => points.toString().split(',').map(string => parseInt(string)).filter(int => !isNaN(int)) 
        result.forEach(variant => {
            variant.exonStarts = map(variant.exonStarts);
            variant.exonEnds = map(variant.exonEnds);
        })
        res.json({err, result});
    });
});

app.listen(8080);
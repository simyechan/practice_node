const http = require('http');
const fs = require('fs');
const url = require('url');
const qs = require('querystring');
const template = require('./lib/template.js');
const path = require('path');
const senitizeHtml = require('sanitize-html');
const mysql = require('mysql2');
require("dotenv").config({path: '.env'});
const db = mysql.createConnection({
    host:process.env.HOST,
    user:process.env.USERNAME,
    password:process.env.PASSWORD,
    database:process.env.DATABASE
});
db.connect();

const app = http.createServer(function(request,response){
    const _url = request.url;
    const queryData = url.parse(_url, true).query;
    const pathname = url.parse(_url, true).pathname;
    if(pathname === '/') {
        if(queryData.id === undefined) {
            db.query(`SELECT * FROM topic`, function(error, topics) {
                var title = 'Welcome';
                var description = 'Hello, Node.js';
                var list = template.list(topics);
                var html = template.html(title, list,
                    `<h2>${title}</h2>${description}`,
                    `<a href="/create">create<a>`
                );
                response.writeHead(200);
                response.end(html);
            });
        } else {
            db.query(`SELECT * FROM topic`, function(error, topics) {
                if(error) {
                    throw error;
                }
                db.query(`SELECT * FROM topic WHERE id=?`, [queryData.id], function(error2, topic) {
                    if(error2) {
                        throw error2;
                    }
                    console.log(topic.title);
                    var title = topic[0].title;
                    var description = topic[0].description;
                    var list = template.list(topics);
                    var html = template.html(title, list,
                    `<h2>${title}</h2>${description}`,
                    `<a href="/create">create<a>
                        <a href="/update?id=${queryData.id}">update</a>
                        <form action="delete_process" method="post">
                            <input type="hidden" name="id" value="${queryData.id}">
                            <input type="submit" value="delete">
                        </form>`
                    );
                response.writeHead(200);
                response.end(html);
                })
            });
        }
    } else if(pathname === '/create') {
        db.query(`SELECT * FROM topic`, function(error, topics) {
            var title = 'Create';
            var list = template.list(topics);
            var html = template.html(title, list,
                `
                <form action="/create_process" method="post">
                    <p><input type="text" name="title" placeholder="title"></p>
                    <p>
                        <textarea name="description" placeholder="description"></textarea>
                    </p>
                    <p>
                        <input type="submit">
                    </p>
                </form>
                `,
                `<a href="/create">create<a>`
            );
            response.writeHead(200);
            response.end(html);
        });
    } else if(pathname === '/create_process') {
        var body = '';
        request.on('data', function(data) {
            body = body + data;
        });
        request.on('end', function() {
            var post = qs.parse(body);
            db.query(`
            INSERT INTO topic (title, description, created, author_id)
             VALUES(?, ?, NOW(), ?);`,
            [post.title, post.description, 1],
            function(error, result) {
                if(error) {
                    throw error;
                }
                response.writeHead(302, {location: `/?id=${result.insertId}`});
                response.end('success');
            })
        });
    } else if(pathname === '/update') {
        db.query(`SELECT * FROM topic`, function(error, topics) {
            if (error) {
                throw error;
            }
            db.query(`SELECT * FROM topic WHERE id=?`, [queryData.id], function(error2, topic) {
                if (error2) {
                    throw error2;
                }
                var list = template.list(topics);
                var html = template.html(topic[0].title, list,
                `
                <form action="/update_process" method="post">
                    <input type="hidden" name="id" value="${topic[0].id}">
                    <p><input type="text" name="title" placeholder="title" value="${topic[0].title}"></p>
                    <p>
                        <textarea name="description" placeholder="description">${topic[0].description}</textarea>
                    </p>
                    <p>
                        <input type="submit">
                    </p>
                </form>
                `, 
                `<a href="/create">create<a> <a href="/update?id=${topic[0].id}">update</a>`
                );
                response.writeHead(200);
                response.end(html);
            });
        });
    } else if(pathname === '/update_process') {
        var body = '';
        request.on('data', function(data) {
            body = body + data;
        });
        request.on('end', function() {
            var post = qs.parse(body);
            db.query(`
                UPDATE topic SET title=?, description=?, author_id=1 WHERE id=?
                `, 
                [post.title, post.description, post.id], 
                function(error, result) {
                response.writeHead(302, {location: `/?id=${post.id}`});
                response.end();
            })
        });
    } else if(pathname === '/delete_process') {
        var body = '';
        request.on('data', function(data) {
            body = body + data;
        });
        request.on('end', function() {
            var post = qs.parse(body);
            var id = post.id;
            var filteredId = path.parse(id).base;
            fs.unlink(`data/${filteredId}`, function(error) {
                response.writeHead(302, {location: `/`});
                response.end();
            });
        });
    } else {
        response.writeHead(404);
        response.end('Not found');
    }

});
app.listen(3000);
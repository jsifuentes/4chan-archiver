const striptags     = require('striptags');
const Html5Entities = require('html-entities').Html5Entities;

const entities = new Html5Entities();

module.exports = function dehtmlify (html) {
    html = html.replace(/<br\s*\/?>/mg,"\n");
    let cleanHtml = striptags(html);
    cleanHtml = entities.decode(cleanHtml);
    return cleanHtml;
};
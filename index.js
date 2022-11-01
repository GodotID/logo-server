const crypto = require('crypto');
const fs = require('fs');

const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const express = require('express');

const _xml_opt = { ignoreAttributes: false, attributeNamePrefix: '@_' };
const xml = new XMLParser(_xml_opt);
const xmlb = new XMLBuilder(_xml_opt);
const app = express();

const base = fs.readFileSync('assets/base.svg').toString();

function getPatterns() {
	return fs.readdirSync('assets/patterns/');
}

function getTodaysPattern() {
	let int = parseInt(crypto.createHash('md5').update(Date.now().toString()).digest('hex'), 16);

	let patterns = getPatterns();
	let ind = int % patterns.length;

	if (!(ind >= 0)) ind = 0;

	let ptrn = fs.readFileSync(`assets/patterns/${patterns[ind]}`).toString();
	return ptrn;
}

app.get('/favicon', (req, res) => {
	let src = getTodaysPattern();
	let components = {
		mouthptrn: false,
		headptrn: false,
		lowerheadptrn: false,
		eyeleftptrn: false,
		outereyeleftptrn: false,
		noseptrn: false,
		eyerightptrn: false,
		outereyerightptrn: false
	};
	let ckeys = Object.keys(components);
	let { pattern } = xml.parse(src);
	let basexml = xml.parse(base.replace('{{mainptrn}}', src));

	if (!Array.isArray(pattern)) pattern = [pattern];

	for (const p of pattern) {
		if (ckeys.includes(p['@_id'])) {
			components[p['@_id']] = true;
		}
	}

	for (let i = 0; i < ckeys.length; i++) {
		if (components[ckeys[i]]) {
			basexml.svg.path[i]['@_fill'] = `url(#${ckeys[i]})`;
		}
	}

	let final = xmlb.build(basexml);

	res.set('content-type', 'image/svg+xml');
	res.end(final);
});

if (!process.env.DETA_RUNTIME) {
	app.listen(8080, console.log.bind(globalThis, '[i] Ran at 8080'));
} else {
	module.exports = app;
}

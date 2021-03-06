#!/usr/bin/env node
'use strict';
const rollup = require('rollup').rollup;
const buble = require('rollup-plugin-buble');
const uglify = require('rollup-plugin-uglify');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonJs = require('rollup-plugin-commonjs');
const filesize = require('rollup-plugin-filesize');
const readPkg = require('read-pkg').sync;

const packageInfo = readPkg();
const banner = `/*! npm.im/${packageInfo.name} ${packageInfo.version} */`;

const outputFilename = process.argv[2];
let globalVarName = process.argv[3];

const iifeName = `dist/${outputFilename}.js`;
const cjsName = `dist/${outputFilename}.common-js.js`;
const esName = `dist/${outputFilename}.es-modules.js`;
let minName = `dist/${outputFilename}.min.js`;

const isByteCountingOnly = globalVarName === '--byte-count';
if (isByteCountingOnly) {
	globalVarName = 'bytes';
	minName = 'dist/size-measuring-only';
}

const preserveBanner = isByteCountingOnly ? {} : {
	output: {
		comments(node, comment) {
			if (comment.type === 'comment2') {
				return comment.value[0] === '!';
			}
		}
	}
};

console.log('Building:');
if (globalVarName) {
	if (!isByteCountingOnly) {
		console.log('•', iifeName);
		rollup({
			entry: 'index.js',
			plugins: [
				buble(),
				nodeResolve({
					browser: true,
					jsnext: true
				}),
				commonJs()
			]
		}).then(bundle =>
			bundle.write({
				format: 'iife',
				moduleName: globalVarName,
				dest: iifeName,
				banner
			})
		).catch(console.error);
	}

	console.log('•', minName);
	rollup({
		entry: 'index.js',
		plugins: [
			buble(),
			nodeResolve({
				browser: true,
				jsnext: true
			}),
			commonJs(),
			uglify(preserveBanner),
			filesize({
				format: {
					exponent: 0
				}
			})
		]
	}).then(bundle =>
		bundle.write({
			format: 'iife',
			moduleName: globalVarName,
			dest: minName,
			banner
		})
	).catch(console.error);
}

console.log('•', cjsName);
console.log('•', esName);
rollup({
	entry: 'index.js',
	plugins: [
		buble()
	]
}).then(bundle => Promise.all([
	bundle.write({
		format: 'cjs',
		dest: cjsName,
		banner
	}),
	bundle.write({
		format: 'es',
		dest: esName,
		banner
	})
])).catch(console.error);

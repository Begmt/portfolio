const fs=require('node:fs'),path=require('node:path');
const validator=require('../avatar-guide/runtime/reconstruction/review-tools/node_modules/gltf-validator');
const source=path.resolve(__dirname,'../avatar-guide/sample_2026-11-09T202723.078.glb');
validator.validateBytes(new Uint8Array(fs.readFileSync(source)),{uri:path.basename(source),maxIssues:1000,externalResourceFunction:()=>Promise.reject(new Error('No external resources expected'))}).then(report=>{fs.writeFileSync(path.join(__dirname,'validator-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({validatorVersion:report.validatorVersion,issues:report.issues,info:report.info},null,2));if(report.issues.numErrors)process.exitCode=1;}).catch(error=>{console.error(error);process.exitCode=1;});

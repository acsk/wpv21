'use strict'

const puppeteer = require('puppeteer');
const fs = require('fs');
const del = require('del');

exports.remove_caches = async function(instancia){

    return new Promise( async (resolve, reject) => {

            var path = "./tokens/" + instancia; 
            var flag_dir = fs.existsSync(path);
            console.log("Pasta de sessão existe? " + flag_dir);

            var file_exist = false;
            fs.access(path + '.data.json', fs.constants.F_OK, (err) => {
                console.log(err ? 'Arquivo json cache não existe' : 'Arquivo json do cache existe');
                if(!err){
                    file_exist = true;
                }
               
              });

             
            
                try{
                    console.log("Removendo pasta de sessão...")

                    if (flag_dir == true){

                        if(file_exist == true){
                            /* remover todos os arquivo da pasta da instancia (cache) */
                                await fs.unlink(path + '.data.json', (err) => {
                                    if (err) {
                                        console.log("Erro ao tentar remover a pasta: " + err);
                                        if (err) throw err;
                                    }
                                
                                    console.log(`❌ ${path} - arquivo de cache deletado!`);
                                    return true;
                                });
                            }
                        
                        /* remover pasta do cache da instancia */
                        /* await fs.rmdirSync(path, { recursive: true }, (err) => {
                            if (err) {
                                console.log("Erro ao tentar remover a pasta: " + err);
                                if (err) throw err;
                            }
                        
                            console.log(`❌ ${path} - arquivo de cache deletado!`);
                            return true;
                        }); */

                        await del.sync([path]); 
                        
                    }

                    resolve(true);

                }catch(err){
                    console.log("Erro ao tentar remover a pasta de sessão: " + err);
                    resolve(false)
                }      

            

    }); /* fim promise */

}
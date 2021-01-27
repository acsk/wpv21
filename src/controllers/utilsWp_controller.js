'use strict'

const fs = require('fs');
var mime = require('mime-types');
var confApi = require('../../config/api');

exports.formatReceivedFile = async function(instancia, requisicao){

       /* salvar o arquivo recebido na mensagem em diretorio local (para cliente acessar via link do front) */
       var now = new Date();
       var nameFile = "";
       var fileName = "";
       var base_dir = "";
       var ret = ""; 
       var tipo = ""; 

       /* retornar o objcto da mensagem usando CHatID (id do chat - conversa) */
       var message = {};

       /* filtrar chat */
       var chat =  await instancia.loadAndGetAllMessagesInChat(requisicao.number,true);

       for(var i = 0; i < chat.length; i++){
            
            /* verificar id da message */
            if(chat[i].id == requisicao.MsgId){
              //console.log(chat[i]);
              message = chat[i];
              break;
            }

       }

       if(message){
          nameFile = requisicao.MsgId  + '-' + now.getSeconds() + "." +  mime.extension(message.mimetype);
       }else{
         return {"retorno":"erro conversasão não identificada!"};
       }

       var buffer = await instancia.downloadFile(message);             
              
      console.log(message);
    return new Promise( async (resolve, reject) => {
                /* =============== alterar conteudo de arquivo recebido (DIRETORIO, OU BASE64) ================ */
                            /* verificar as configurações para API  PARA DOWNLOAD DE ARQUIVO RECEBIDO */
        if(confApi.files.return_patch_files == true){
                                /* ==== ATENÇÃO ======= PARA DOCS precisa aplicar descriptografar arquivo */
            
                /* se for audio */
               if(message.type = "ptt"){
                
                 tipo = "audio";
                 base_dir = "/../../public/files/wapi/download/" + tipo + "/" + nameFile;
                 fileName = __dirname + base_dir;

                 /* criar o arquivo .ogg */
                 await fs.writeFileSync(fileName, buffer, function (err){
                     ret = err;
                     console.log(err);
                 });

                 if(!ret){
                    message.directPath = "/files/wapi/download/" + tipo + "/" + nameFile;
                    console.log(message.directPath);
                }

                 /* converter criado para mp3 */
              //  var b64 = await fs.readFileSync(fileName,'base64');
                 /* mudar extenção na string dir do arquivo .ogg para .mp3 */
               // var dirFinal = fileName.substr(0, fileName.lastIndexOf('.'));
              //  var DirMp3 = dirFinal + '.mp3';
               //  console.log(dirFinal);
                /* criar arquivo .mp3 */
               /*  await fs.writeFileSync(DirMp3, 'data:audio/mp3;base64,' + b64, function (err){
                     ret = err;
                     console.log(err);
                 }); */

                 /* se for documento */
               }else if(message.type = "document"){

                 tipo = "documento";
                 base_dir = "/../../public/files/wapi/download/" + tipo + "/" + nameFile;
                 fileName = __dirname + base_dir;
                
                 await fs.writeFileSync(fileName, buffer, function (err){
                     ret = err;
                     console.log(err);
                 });
              

               }else{

                 tipo = "diversos";
                 base_dir = "/../../public/files/wapi/download/" + tipo + "/" + nameFile;
                 fileName = __dirname + base_dir;
                
                 await fs.writeFileSync(fileName, buffer, function (err){
                     ret = err;
                     console.log(err);
                 });
             }

                /* se houver erro retornar */
                if(ret){

                 message.body = "ocorreu erro ao gerar o link: " + ret; /* retornar erro na geração do arquivo */
                 reject({"erro":"ocorreu um erro ao gerar o arquivo.",retorno:message});

               }

               /* se o formato for docx ou doc */
               var ext = mime.extension(message.mimetype);
               if(ext == 'docx' || ext == 'doc' || typeof message.directPath == undefined){
                   /* neste caso irá criar o indice (body) */
                   message.directPath = "/files/wapi/download/" + tipo + "/" + nameFile;
                }


             resolve({retorno:message});

              

         }else{

            reject({"erro":"APi não configrada para tratativa de arquivos.",retorno:message});

         }

    });


}
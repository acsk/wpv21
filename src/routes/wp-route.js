
var wapi_srv = require('@wppconnect-team/wppconnect');
const fs = require('fs');
var mime = require('mime-types');
var confApi = require('../../config/api');
var utils = require('../controllers/utilsWp_controller');
var wpCtr = require('../controllers/wp_controller');
const ctrFile = require('../controllers/Files_controller');
var request = require('request'); /* enviar post -> php */
var extend = require('extend'); /* extender objects */


const { response } = require('../app');


/* variaveis globais */
var qrcode;
var instancias = []; /* {'name':'vendas','instancia':client} */
var instStatus = []; /* retornar status das instancias na rota */
var notificacoes = [];
/* config drive chromium */
/* config timeout in line: 76 arquive: wapi_srv20\node_modules\wapi_srv\dist\controllers\browser.js */
/* configs venom */
var configs = {
  session: "",
  folderNameToken: "tokens", //folder name when saving tokens
  headless: true, // Headless chrome
  devtools: false, // Open devtools by default
  useChrome: true, // If false will use Chromium instance
  debug: false, // Opens a debug session
  logQR: true, // Logs QR automatically in terminal
  browserArgs: confApi.browser, // Parameters to be added into the chrome browser instance
  refreshQR: 12000, // Will refresh QR every 15 seconds, 0 will load QR once. Default is 30 seconds
  autoClose: 1 * (1000*60), // Will auto close automatically if not synced, 'false' won't auto close. Default is 60 seconds (#Important!!! Will automatically set 'refreshQR' to 1000#)
  disableSpins: false, // Will disable Spinnies animation, useful for containers (docker) for a better log
  disableWelcome: true, // Will disable the welcoming message which appears in the beginning
  updatesLog:false,
  createPathFileToken:true,
  waitForLogin:true,
  /* update edgard - 23-08-2021 */
  //logger: defaultLogger,
  tokenStore: 'file',
  puppeteerOptions: {
      userDataDir: '' 
  },
  whatsappVersion: undefined,
}

/* função instancias */
async function setup_instancia(instancia,session_rem){
  var consulta = {'flag_exist':false,'instancia':undefined};
  var status;


  /*
  async () => {
      const marketingClient = await wapi_srv.create('marketing');
      const salesClient = await wapi_srv.create('sales');
      const supportClient = await wapi_srv.create('support');
    };
  */


   /* verificar se instancia solicitada já existe */
  consulta = await verify_instance(instancia);
  

      if(consulta.flag_exist == false){

          /* criar object instancia com status de aguardando qrcode (UNPAIRED) */
          instancias.push({'name':instancia,'qrcode':qrcode,'status':'UNPAIRED','instancia':undefined,'webhook':{}});

          /* remover cache da sessao anterior */
          if(session_rem == true){

            await wpCtr.remove_caches(instancia);

          }

       
          /* formatar e construir a instancia */
          var setIntance = {};
          configs.session = instancia;
          configs.puppeteerOptions.userDataDir = 'tokens/' + instancia;       
          extend(setIntance,configs);

         // fs.rmdirSync(path, { recursive: true });
        // wapi_srv.defaultLogger.level = 'silly'; /* logs da api */
         wapi_srv.create(setIntance, (base64Qr, asciiQR, attempts, urlCode) => {      
           
         
              /* atualizar qrcode */
              instancias.forEach( async function(item){
                /* VARRER O OBJECT DA INSTANCIA CRIADA E GRAVAR O QRCODE NA RESPECTIVA INSTANCIA */
                if(item.name == instancia){ 
                  
                  if(item.instancia){
                    console.log("⛔ A instância já existe, abortando qrcode: ", item.name);
                    return true;
                  }
                 
                 // console.log(configs);
                  /* verificar as configurações para API */
                  if(confApi.files.return_patch_files == true){

                      var dirDestFile = __dirname + "/../../public/files/wapi/qrcodes/" + item.name + ".png";
                      fileExportQR(base64Qr,dirDestFile);

                      item.qrcode = "files/wapi/qrcodes/" + item.name + ".png";
                      item.status = "UNPAIRED";

                  }else{

                      /* atualizar o qrcode (base64) */
                      item.qrcode = base64Qr;
                      item.status = "UNPAIRED";

                  }
                 
                  return;
                }

              });

            

         
        }, (statusSession, session_name) => {

          /* TRATAR STATUS DA SESSÕES */

              console.log('- Status da sessão:', statusSession);
              //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken
              //Create session wss return "serverClose" case server for close
              console.log('- Session name: ', session_name);

              for(var i =0;i < instancias.length; i++){

                    if(instancias[i].name == session_name){
                     
                      
                          if (statusSession == 'isLogged' || statusSession == 'inChat') {

                            instancias[i].qrcode = "syncronized";
                            instancias[i].status = true;

                          } else if (statusSession == 'qrReadSuccess') {

                            instancias[i].qrcode = "syncronized";
                            instancias[i].status = true;

                          }else if (statusSession == 'qrReadFail' || statusSession == 'browserClose' || statusSession == 'notLogged'|| statusSession == 'qrReadError') {
                           
                            if(instancias[i].name == session_name && !instancias[i].instancia){
                              console.log("❌Sessão desconectada: " + statusSession);
                              instancias[i].qrcode = statusSession;
                              instancias[i].status = "DISCONECTED";
                            }

                          }else if(statusSession == 'autocloseCalled'){
                              console.log("❌Sessão autocancelada, removendo sessão.")                           
       
                              if(instancias[i].name == session_name && !instancias[i].instancia){
                                if(instancias[i].name == session_name){
                                  instancias.splice(i, 1);
                                  console.log("✅Sessão removida com sucesso.");
                                  break;                                                                  
                                }
                              }
                      
                            //instancias[i].qrcode = statusSession;
                            //instancias[i].status = "false";
                          }else if(statusSession == 'desconnectedMobile' || statusSession == 'TIMEOUT'){

                            /* se desconectar através do aparelho remover o arquivo do cache da sessão. */
                           // await setup_status_action(statusSession,'destroy',instancias[i].intancia);
                           console.log("❌❕ Dados da Instancia Desconectada no Celular: ------------->",instancias[i].intancia)

                          }

                    }

              }/* fim do laço */
             

        }).then(async function(client){


            /* gravar a instancia na variavel global após qrcode Sincronizado */
            instancias.forEach(function(item){

              if(item.name == instancia){
  
                /* atualizar o qrcode */
                item.qrcode = "syncronized";
                item.status = true;
                item.instancia = client;
               // client.close();
               
  
              }
  
            });

        // console.log(client.page);
          
          //client.sendText('5516997141457@c.us', '👋 Hello from wapi_srv!');
         
          /* retornar status e formular object instancias */
          client.onStateChange( async (state) => {
           
            // console.log(state); /* status */
             status = state;
            console.log("STATUS:", state)

             if(state == 'UNPAIRED'){

                await setup_status_action(state,'destroy',client);

             }else{

              /* qualquer outros status forçar a reconexão caso, haja perda. */
              await setup_status_action(state,'forceOn',client);

             }
                    
              
 
             
           });

            /* estado atual da conexão */
          client.onStreamChange( async (stateconn) => {

              console.log("onStreamChange = status atual da conexão: ", stateconn);

          });

           /* ouvir mensagens (tempo real conforme recebe mensagens) */
         //  console.log(client.onMessage());
          client.onAnyMessage(message => {

            /* identificar se é registro de atualização de status (do whatsapp) */
            if (message.broadcast){
              return; /* não fazer nada */
            } 

            if (message.fromMe == false){  /* não enviada pela sessão ativa */
            
              /* gravar novas mensagens no hook da instancia */
              instancias.forEach( async function(item){

                  if(item.instancia == client){
                    
                     //console.log(message);
                      
                      if(message){
                          /* nova mensagen */
                         item.webhook = message; 

                        
                        // console.log("Nova Mensagem armazenada!" + message.body);
                         /* verificar se a mensagem é um arquivo */
                         

                           /* apos formatar o formato do retorno do arquivo (arquivo ou base64) então enviar post de notificação ao sistema client */
                          if(confApi.send_post_php.active == true){                        
                        
                            
                              console.log("✅ Enviando o post para o sistema cliente...");
                              
                                /* enviar object new msg para sistema php via post */
                              await send_post({'instancia':item.name,'msg':message});
                              
                            //  console.log("Nova Mensagem armazenada!" + message.body); 
                              /* após enviar o post marcar mensagens do remetente como lidas */
                              await client.sendSeen(message.from);

                          }

                      }
                      
                     
                  } /* varrer mensaem recebida e salvar arquivo de download dentro da pasta public/files */
                
    
              });

            }
            //console.log(instancias);
            
                      
          });         

        
         
         /* após sincronizar reiniciazar object consulta de instancia */
         consulta = {'flag_exist':false,'instancia':undefined};
         
        
        });

    }


}

/* verificar se instancia existe */
 async function verify_instance(instancia){

    var retorno = {'flag_exist':false,'instancia':undefined};

      /* verificar se instancia solicitada já existe e retornar a mesma */      
      instancias.forEach( async function(item){ 
       
        if(item.name == instancia){          
          console.log('✍️Verificando se existe a instancia: ' + item.name);          

          retorno.flag_exist = true
          retorno.instancia = item.instancia; /* instancia criada no wapi */
          retorno.hook = item.webhook; /* ultima mensagen recebida */
        }       
      
    }); 

    // console.log(retorno);
    return retorno;   
}





/*  controle de ação quando:   *************>>>> quando usuario entrar em outro local (status: CONFLIT) e/ou sair da sessao pelo celular (UNAPIRED E UNPAIRED_IDLE)  */
async function setup_status_action(state,action,client){
              var res = false;


              console.log("O status atual é: " + state);
     // client.forceRefocus();
               /* se o usuário encerrar a sessão pelo celular (whatsapp) então definir as variáveis globais como usuário desconectado */
               for(var i =0;i < instancias.length; i++){
               
                if(instancias[i].instancia == client){

                  if(state == "CONNECTED"){

                    instancias[i].flag_exist = true;
                    instancias[i].qrcode = 'syncronized';
                    instancias[i].status = true;

                  }

               
                 
                  if (state == "UNPAIRED"){                   

                   /* remover instancia desconectada pelo usuário no smartphone */
                    if(instancias[i].instancia){

                            if(action !== 'forceOn'){

                                try{
                                  instancias[i].flag_exist = false;
                                  instancias[i].qrcode = 'despareado';
                                  instancias[i].status = false;
                                 

                                  process.on('SIGINT', function() {
                                    instancias[i].instancia.close();
                                  }) 
                                  console.log("❌ Usuário desconectou/removeu a sessão, despareando a instancia do cliente..." + instancias[i].name);
                                  await wpCtr.remove_caches(instancias[i].name);
                                  instancias.splice(i, 0);                                  
                                  return;
                                  // instancias[i].instancia = undefined;
                                }catch(err){

                                  console.log('🛑 Erro: Ao fechar a instancia!' + err);
                                  break;
                                }
                       
                               

                            }else if(action == 'forceOn'){

                             
                                console.log(" (UNPAIRED) reconectando a sessão!!");
                               
                                await instancias[i].instancia.useHere();
                              

                            }
                        // instancias.splice(i, 0); /* remover item (instancia) */
                     
                    
                   }
                    
                                      
                  }

                  if(state == 'UNPAIRED_IDLE'){
                        console.log("⚠️ -----> A sessão está despareado temporariamente!");

                      /*  if(action == 'forceOn'){
                            
                              console.log(state);
                             
                                console.log(" (CONEXÃO PERDIDA) reconectando a sessão!!");                              
                                await instancias[i].instancia.useHere();
                               
                              
                        } */
                  }

                   // forçar reconectar
                  if(state == 'CONFLICT'){

                   // console.log("Cliente conectou em outro local, reconectando novamente...");
                   /* retornar conexão para api */
                   // inst_atual.forceRefocus();

                        if(action == 'destroy'){
                          /* remover instancia se o usuário conectar em outro local */
                              try{

                                  instancias[i].flag_exist = false;
                                  instancias[i].qrcode = 'despareado';
                                  instancias[i].status = false;
                                  

                                  process.on('SIGINT', function() {
                                    instancias[i].instancia.close();
                                  })
                                  
                                  instancias[i].instancia = undefined;

                                  console.log("❌ Usuário conectou a sessão em outro local (whatsapp web), despareando a instancia do cliente..." + instancias[i].name);

                              }catch(err){
                                 
                                  console.log('🛑 Erro: Ao fechar a instancia!' + err);
                                  break;

                              }

                        }else if(action == 'forceOn'){

                        
                            console.log(" (CONFLITO DE LOCAIS CONECTADOS) reconectando a sessão!!");
                            await instancias[i].instancia.useHere();

                        }

                  }

                /*  console.log('✍🏽 instancia despareada:  ======== ');
                  console.log(instancias[i]); */
                 
               
              }
            }

            return true;
}

/* retornar o contido no object instancias */
async function getInfoIntance(instancia){
      var session = "";
      instancias.forEach(function(item){

        if(item.name == instancia){
         
          /* atualizar o qrcode */         
          session = item;
        }

      });   

      return session;
}

/* retornar todos os contatos da instancia */
exports.getAllContacts = async function(req,res){

  var requisicao = req.body;
  var status = "Inexistente";
  var consulta = await verify_instance(requisicao.instancia);
 

  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    var contacts;
  
    // Is connected
    if(inst){      

        status = await inst.isConnected();
        contacts = await inst.getAllContacts();       
       // console.log(hook);
    }
    

  }

  res.status(200).send({'instancia':requisicao.instancia,'contatos':contacts,'status':status});

}


/* 12-08-2020 - retornar chat por contato */
exports.getChat = async function(req,res){

  var requisicao = req.body;
  var inst;
  var consulta;
  var status = false;

  /* verificar se instancia existe */
  consulta = await verify_instance(requisicao.instancia);

  
  //console.log(consulta);
  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    var chat = {}
  
    // Is connected
    if(inst){      


        status = await inst.isConnected();

        try{
          chat =  await inst.loadAndGetAllMessagesInChat(requisicao.number,true);   
        } catch (error) {
          chat = {"erro":"contato inexistente..."}
        }    
       // console.log(hook);
    }
    

  }

  res.status(200).send({'instancia':requisicao.instancia,'chat':chat,'status':status});

}

/* retornar mensagem com url do arquivo (descriptografado) */
exports.FormatMessageFiles = async function(req,res){

      var requisicao = req.body;
      var inst;
      var consulta;
      var status = false;
      var message = {};

      /* verificar se instancia existe */
      consulta = await verify_instance(requisicao.instancia);

      
      //console.log(consulta);
      if(consulta.flag_exist == true){

        var inst = consulta.instancia;
        
        if(typeof requisicao.MsgId == undefined || !requisicao.MsgId){

          res.status(400).send({'instancia':requisicao.instancia,'message':{},'retorno':'favor informe o ChatId (id da mensagem).'});
          return;

        }

        // Is connected
        if(inst){      


            status = await inst.isConnected();

            try{
              
                    /* =============== alterar conteudo de arquivo recebido (DIRETORIO, OU BASE64) ================ */
                    /* verificar as configurações para API  PARA DOWNLOAD DE ARQUIVO RECEBIDO */  
                    var msgFormated = {};  
                      
                    if(confApi.files.decript_file_chat == true){
                        var retorno = await utils.formatReceivedFile(inst,requisicao).catch( await function(res){
                            
                            console.log("Resultado do retorno de processamento de arquivo do chat: ",res)
                            return res.retorno;

                        });
                    }

                      msgFormated = retorno;
                      //console.log(retorno);

                      if(msgFormated){
                        message = msgFormated;
                        res.status(400).send({'instancia':requisicao.instancia,'retorno':msgFormated,'status':status});
                        return;
                      }

            }catch (error) {
              message = {"erro":'Ocorreu um erro ao efeturar operação.'}
            }    
          // console.log(hook);
        }
        

      }

      res.status(400).send({'instancia':requisicao.instancia,'retorno':message,'status':status});


}


/* enviar mensagem de texto */
exports.sendMensagem = async function(req, res){
  var requisicao = req.body;
  var inst;
  var consulta;
 

   /* verificar se instancia existe */
   consulta = await verify_instance(requisicao.instancia);

   if(consulta.flag_exist == true && consulta.instancia !== undefined){

      inst = consulta.instancia;

      var retorno = await inst.sendText(requisicao.number, requisicao.msg);
      // console.log(retorno);
        /* se o envio falhar retirar o 9º dígito e tentar novamente */
        if(retorno == false){

          console.log(" ==== Resolvendo, 9º dígito, para tentar novo envio...");
          var texto = requisicao.number;
          var numero = texto.slice(0, texto.length - 14);
          numero += "" + texto.slice(5, texto.length);

          /* atualizar o numero de envio (tirar o 9) */
          requisicao.number = numero;

          console.log("========================" + requisicao.number);
                    /* só atualizar o numero de envio. (colocar null na mensagem caso contrário envia mensagem duas vezes.) */
          retorno = await inst.sendText(requisicao.number, null);

          res.status(200).send({'retorno':retorno});
          return;

      }else{

          res.status(200).send({'retorno':retorno});
          return;

      }

     
   }else{

      res.status(200).send({'retorno':false});

   }
 
};

/* enviar mensagem para novo contatos */
exports.sendMsgNewContact = async function(req, res){
  var requisicao = req.body;
  var inst;
  var consulta;  

   /* verificar se instancia existe */
   consulta = await verify_instance(requisicao.instancia);

   if(consulta.flag_exist == true && consulta.instancia !== undefined){

      inst = consulta.instancia;
     
      var retorno = await inst.sendMessageToId(requisicao.number, requisicao.msg);
      
       /* se o envio falhar retirar o 9º dígito e tentar novamente */
         /* se o envio falhar retirar o 9º dígito e tentar novamente */
         if(retorno == false){

          console.log(" ==== Resolvendo, 9º dígito, para tentar novo envio...");
          var texto = requisicao.number;
          var numero = texto.slice(0, texto.length - 14);
          numero += "" + texto.slice(5, texto.length);

          /* atualizar o numero de envio (tirar o 9) */
          requisicao.number = numero;
                    /* só atualizar o numero de envio. (colocar null na mensagem caso contrário envia mensagem duas vezes.) */
          retorno = await inst.sendMessageToId(requisicao.number, null);

          res.status(200).send({'retorno':retorno});
          return;

      }else{

          res.status(200).send({'retorno':retorno});
          return;

      }

   }else{

      res.status(200).send({'retorno':false});

   }
 
};


/* ouvir mensagens */
exports.newMsg = async function(req,res){

  var requisicao = req.body;
  var status = "Inexistente";
  var consulta = await verify_instance(requisicao.instancia);
 

  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    var hook = consulta.hook;
  
    // Is connected
    if(inst){      

        status = await inst.isConnected();       
       // console.log(hook);
    }
    

  }

  res.status(200).send({'instancia':requisicao.instancia,'hook':hook,'status':status});  

}

/* getProfilePic */
exports.getProfilePic = async function(req, res){

    var requisicao = req.body;
    var status = "Inexistente";
    var consulta = await verify_instance(requisicao.instancia);

    
  //console.log(consulta);
  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    var urlPic = {}
  
    // Is connected
    if(inst){      


        status = await inst.isConnected();

        try{
          await inst.getProfilePicFromId(requisicao.number).then(function(res){

              console.log(res);

              urlPic = res;

              res.status(200).send({'instancia':requisicao.instancia,'img':urlPic,'status':status}); 
              return;

          });   
        } catch (error) {
          urlPic = "erro ao gerar link";
        }    
       // console.log(hook);
    }
    

  }

  res.status(200).send({'instancia':requisicao.instancia,'img':urlPic,'status':status}); 

}

/* retornar todas as mensagens de um contato */
exports.get_AllMsgs = async function(req,res){

  var requisicao = req.body;
  var status = "Inexistente";
  var consulta = await verify_instance(requisicao.instancia);
 // var chatId = requisicao.number;


  //console.log(consulta);
  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    var webhook = {}
  
    // Is connected
    if(inst){      


        status = await inst.isConnected();

        try{
          webhook =  await inst.getAllChats();   
        } catch (error) {
          webhook = {"erro":"contato inexistente..."}
        }    
       // console.log(hook);
    }
    

  }

  res.status(200).send({'instancia':requisicao.instancia,'webhook':webhook,'status':status}); 
}

/* retornar mensagens não lidas */
exports.getUnreadMsg = async function(req,res){

  var requisicao = req.body;
  var status = "Inexistente";
  var consulta = await verify_instance(requisicao.instancia);
  var messages = [];
 

  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
  
    // Is connected
    if(inst){      

        status = await inst.isConnected();       
        messages = await inst.getAllUnreadMessages();
    }
    

  }

  res.status(200).send({'instancia':requisicao.instancia,'msgs':messages,'status':status}); 

}

/* converter url for base64 */
var loadBase64Image = async function (url, callback) {
  // Required 'request' module
 
      imageToBase64(url) // Image URL
      .then(
          (response) => {
              return response; // "iVBORw0KGgoAAAANSwCAIA..."
          }
      )
      .catch(
          (error) => {
              console.log(" Erro ao ler a url do arquivo a ser enviado: " + error); // Logs an error if there was one
          }
      )

};


/* enviar mensagem com img */
exports.sendMsgMedia = async function(req,res){
    var requisicao = req.body;
    var status = "Inexistente";
    var consulta;
    var result = false;
    var chatId = requisicao.number;
    var msg = requisicao.msg;
    var fileName = requisicao.tipo;

    
    consulta = await verify_instance(requisicao.instancia);    

    if(consulta.flag_exist == true && requisicao.arquivo && chatId && msg){

        var inst = consulta.instancia;         

        // Is connected
        if(inst){      

            status = await inst.isConnected();
            var pars = {
              'instancia':consulta.nome,
              'sessao': inst,
              'number': chatId,
              'fileName':requisicao.tipo,
              'arquivo': requisicao.arquivo,
              'msg': msg
            };

           try{

            result = await ctrFile.formatFilesSend(pars).then( async function(rs){
                       
                        return rs;

                    }).catch((erro) => {
                        console.error('Error na tentativa de enviar mensagem com arquivo: ', erro); //return object error
                        return erro;
                        
                    });
	}catch(error){

		res.status(200).send({'instancia':requisicao.instancia,'status':status,'retorno':"Erro ao executar a operação",'info':error.toString()});

	}


        }
      

    }

    res.status(200).send({'instancia':requisicao.instancia,'status':status,'retorno':result.retorno}); 
}

/* pegar qrcode */
exports.getQrcode = async function(req,res){
  /* params:  token */
  var requisicao = req.body;
  var consulta = {'flag_exist':false,'instancia':undefined};
  var status = "UNPAIRED";

  var inst;

  /* verificar se instancia foi informada */
  if(!requisicao.instancia || requisicao.instancia == undefined || requisicao.instancia == ""){
    res.status(200).send({'instancia':requisicao.instancia,'status':status, 'error':'Digite um nome para instancia!'});
    return;
  }

  /* verificar se instancia existe */
  consulta = await verify_instance(requisicao.instancia);
  /* O QRCODE SÓ É CRIADO APÓS ALGUNS SEGUNDOS QUANDO A FUNÇÃO CREATE GERAR PORTANTO AGUARDAR UNS 15 SEGS */


  if(consulta.flag_exist == false){

      await setup_instancia(requisicao.instancia, requisicao.remover_cache);

      /* pegar qrcode da instancia criada */
      sessao = await getInfoIntance(requisicao.instancia);

       //  console.log("======================",sessao);
      if(sessao !== undefined){

        return res.status(200).json({'instancia':requisicao.instancia,'qrcode':sessao.qrcode, 'status':sessao.status});
    
      }else{

        return res.status(200).json({'instancia':requisicao.instancia,'qrcode':'wait...', 'status':sessao.status});

      }
  

  }else if(consulta.flag_exist == true){

     /* pegar qrcode da instancia criada */
     sessao = await getInfoIntance(requisicao.instancia);
     inst = consulta.instancia; /* pull de instancias */
    
     if(inst){

        // Is connected
       // status = await inst.isConnected();
       status = await inst.getConnectionState();/* VERIFICAR STATUS DA CONECÇÃO */
       if(status == "CONNECTED"){
        sessao.status = true;
       }
        
        console.log("Status consulta wp: " + sessao.status);

     }
    
     return res.status(200).json({'instancia':requisicao.instancia,'qrcode':sessao.qrcode, 'status':sessao.status});
     
  }else{

    return res.status(200).json({'instancia':requisicao.instancia,'qrcode':qrcode, 'status':sessao.status});

  }
  
}

/* listar instancias ativas */
exports.get_instancias = async function(req,res){
  var requisicao = req.body;
  var insts = [];
  var status = "em análise...";
  var consulta = {};
  var proms;

      instancias.forEach( async function(item){       

            insts.push({'nome':item.name, 'status':item.status}); 

      });
   
      res.status(200).send({'retorno':insts});

}

/* pegar status */
exports.getStatus = async function(req,res){
  var requisicao = req.body;
  var status = "Inexistente";
  var consulta = await verify_instance(requisicao.instancia);

  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    
    // Is connected
    if(inst){
      status = await inst.isConnected();
      console.log(status);
      
    }
    

  }

  res.status(200).send({'instancia':requisicao.instancia,'status':status});

}


/* manter o status do whatsapp como 'online' ao invez de 'visto por ultimo em:' */

exports.set_OnAgora = async function(req,res){
  var now = new Date();
  var msg = 'Estamos online - ' + now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
  var retorno = false;

  instancias.forEach( async function(item){

    consulta = await verify_instance(item.name);

    var inst = consulta.instancia;
 
    if(consulta.flag_exist == true){

        console.log(" ✍🏻 ====> Alterando status de exibição para os contatos como: 'Estamos Online'!");
          /* alterar status de cada instancia */
       // retorno = inst.setProfileStatus(msg);
       retorno = inst.useHere();
      }
      

  });

  res.status(200).send({'retorno':retorno});
}

/* checkar se número é whatsapp válido */
exports.check_number = async function(req,res){

  var requisicao = req.body;

  var consulta = await verify_instance(requisicao.instancia);
  var status = "Inexistente";
  var retorno = false;

  /* verificar se instancia foi informada */
  if(!requisicao.instancia || requisicao.instancia == undefined || requisicao.instancia == ""){
      res.status(200).send({'instancia':requisicao.instancia, 'retorno':'Digite um nome para instancia!'});
      return;
  }

  if(!requisicao.number || requisicao.number == undefined || requisicao.number == ""){

    res.status(200).send({'instancia':requisicao.instancia, 'retorno':'Favor verifique o número de telefone fornecido!'});
    return;

  }

  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    
    if(inst){

         /* remover o registro da instancia na global - instancias = [{}] */
         for(var i =0;i < instancias.length; i++){

              if(instancias[i].name == requisicao.instancia){
                
                  try {

                    retorno = await inst.getNumberProfile(requisicao.number);
                    if(retorno == 404){
                      retorno = false
                    }
                    
                  }catch (error) {
                    res.status(200).send({'instancia':requisicao.instancia, 'retorno':'Ocorreu um erro ao efetuar a operação, tente novamente...'});
                  }
    
                
              }
    
        }

        

    }

    
  }

  res.status(200).send({'instancia':requisicao.instancia,'retorno':retorno});

}

/* função destruir sessão */
exports.logoff = async function(req,res){
  
  var requisicao = req.body;

  var consulta_ = await verify_instance(requisicao.instancia);
  var status = "Inexistente";

  /* verificar se instancia foi informada */
  if(!requisicao.instancia || requisicao.instancia == undefined || requisicao.instancia == ""){
      res.status(200).send({'instancia':requisicao.instancia,'status':status, 'error':'Digite um nome para instancia!'});
  }

  
      for(var i =0;i < instancias.length; i++){
       
        if(instancias[i].name == requisicao.instancia && instancias[i].instancia == undefined){
          instancias.splice(i, 1);          
          
          status = "DISCONECTED";
          console.log("========> sessao gobal removida!")
        
          if(requisicao.remover_cache == true){

            console.log("❌❕ Dados da Instancia Travada: ------------->",requisicao.instancia)
            await wpCtr.remove_caches(requisicao.instancia);

          }
        }

      } 

    



  if(consulta_.flag_exist == true){

    var inst = consulta_.instancia;
    
    if(inst){


          // Try-catch close
        

        /* fechar/remover sessão  */
         /* remover o registro da instancia na global - instancias = [{}] */
         for(var i =0;i < instancias.length; i++){           
            

              if(instancias[i].name == requisicao.instancia){               
                
                try {
                  
                  //await inst.logout(); fecha, remove cache, e reinicia geração qrcode
                 // await client.killServiceWorker();
                  console.log("==============>Removendo sessao com close...")
                  
                /* remover pasta arquivo de cache da sessao */
                if(requisicao.remover_cache == true){

                  await inst.logout();
                  await inst.killServiceWorker();                 

                }

                  
                  await inst.close().then( async function(res){

                    console.log("instância fechada (close)..." + res);

                    instancias.splice(i, 1);          
       
                    status = "DISCONECTED";

                    /* remover pasta arquivo de cache da sessao */
                      if(requisicao.remover_cache == true){
                          
                        await wpCtr.remove_caches(requisicao.instancia);
                        
                      }

                  });


  
                 
                
              }catch (error) {
                
                  console.log("erro ao destruir a sessão, continuando...");
                  return;
              }

               
                status = "DISCONECTED";
                console.log("Entrou..."); 
                
                instancias.splice(i, 0); /* remover item (instancia) */
                break;
                
              }
        }

        

    }else{
      console.log("Instancia não iniciada globalmente...")
    }


  }

  res.status(200).send({'instancia':requisicao.instancia,'status':status});

  /* se precisar retornar erro */
 // res.status(400).send({'error':'não foi possível realizar operação, favor verifique os dados.'});
 // res.status(200).send({'instancia':requisicao.instancia,'retorno':status});

}


/* retornar qrcde base64 */
 function exportQR(qrCode, path){

    qrCode = qrCode.replace('data:image/png;base64,', '');

  //  console.log(qrCode);
   // const imageBuffer = Buffer.from(qrCode, 'base64');
  
    // Creates 'marketing-qr.png' file
 //   fs.writeFileSync(path, imageBuffer);

   return qrCode;
}

function fileExportQR(qrCode, path){
  qrCode = qrCode.replace('data:image/png;base64,', '');
  const imageBuffer = Buffer.from(qrCode, 'base64');

  // Creates 'marketing-qr.png' file
  fs.writeFileSync(path, imageBuffer);
}

/* u/ tilidades - REMOVER ITEM DO ARRAY */
async function arrayRemove(arr, value) {

  return arr.filter(function(ele){
      return ele != value;
  });

}


/* =======ÃO TERMINADO CONCLUIR 28-08-2020 ======= download de arquivos do contato */
exports.downloadFilesUser = async function(req,res){

  var requisicao = req.query;
  var inst;
  var consulta;  
  var flagExec = false;
  

   /* verificar se instancia existe */
   consulta = await verify_instance(requisicao.instancia);

   if(consulta.flag_exist == true && consulta.instancia !== undefined){

      /* formatar numero (formato wp) */
      requisicao.number = "55" + requisicao.number + "@c.us";

      inst = consulta.instancia;

      var retorno = await inst.sendMessageToId(requisicao.number, requisicao.msg);

      try{
        chat =  await inst.loadAndGetAllMessagesInChat(requisicao.number);   
      } catch (error) {
        chat = {"erro":"contato inexistente..."}
      }  
    

   


      if(confApi.files.return_patch_files == true){
        /* ==== ATENÇÃO ======= PARA DOCS precisa aplicar descriptografar arquivo */
                var buffer = await inst.downloadFile(message);

                /* salvar o arquivo recebido na mensagem em diretorio local (para cliente acessar via link do front) */
                var now = new Date();
                var nameFile = message.id  + '-' + now.getSeconds() + "." +  mime.extension(message.mimetype);
                var fileName = "";
                var base_dir = "";
                var ret = ""; 
                var tipo = ""; 



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

            
                }


      }


    } /* fim da verificação da instancia */


}



/* ======= INTEGRAÇÕES ======= */

/* ISP Controlls - enviar mensagem de texto */
/* enviar mensagem para novo contatos 
  Params:  instancia, number, msg
*/
exports.IspControllsMsg = async function(req, res){
  var requisicao = req.query;
  var inst;
  var consulta;  
  var flagExec = false;
  

   /* verificar se instancia existe */
   consulta = await verify_instance(requisicao.instancia);

   if(consulta.flag_exist == true && consulta.instancia !== undefined){

      /* formatar numero (formato wp) */
      requisicao.number = "55" + requisicao.number + "@c.us";

      inst = consulta.instancia;

      var retorno = await inst.sendMessageToId(requisicao.number, requisicao.msg);

          /* se o envio falhar retirar o 9º dígito e tentar novamente */
        if(retorno == false){

          console.log(" ✍️ ==== Resolvendo, 9º dígito, e tentando novo envio...");
          var texto = requisicao.number;
          var numero = texto.slice(0, texto.length - 14);
          numero += "" + texto.slice(5, texto.length);

          /* atualizar o numero de envio (tirar o 9) */
          requisicao.number = numero;
                    /* só atualizar o numero de envio. (colocar null na mensagem caso contrário envia mensagem duas vezes.) */
          retorno = await inst.sendText(requisicao.number, null);

          res.status(200).send({'retorno':retorno});
          return;

      }else{

          res.status(200).send({'retorno':retorno});
          return;

      }


   }else{

      res.status(200).send({'retorno':false});

   }
 
};


/* integração SGP */
exports.msgSgp = async function(req, res){
  var requisicao = req.query;
  var inst;
  var consulta;  
  var flagExec = false;
  var instancia = "jmsoft";

   /* verificar se instancia existe */
   consulta = await verify_instance(instancia);

   if(consulta.flag_exist == true && consulta.instancia !== undefined){

      /* formatar numero (formato wp) */
      requisicao.to = "55" + requisicao.to + "@c.us";

      inst = consulta.instancia;

      var retorno = await inst.sendText(requisicao.to, requisicao.msg);

          /* se o envio falhar retirar o 9º dígito e tentar novamente */
        if(retorno == false){

          console.log(" ✍️ ==== Resolvendo, 9º dígito, e tentando novo envio...");
          var texto = requisicao.to;
          var numero = texto.slice(0, texto.length - 14);
          numero += "" + texto.slice(5, texto.length);

          /* atualizar o numero de envio (tirar o 9) */
          requisicao.number = numero;
                    /* só atualizar o numero de envio. (colocar null na mensagem caso contrário envia mensagem duas vezes.) */
          retorno = await inst.sendText(requisicao.to, null);

          var rs = "Ocorreu um erro.";
          if(retorno){
              rs = "Mensagem enviada com Sucesso!"
          }

          res.status(200).send({'retorno':rs});
          return;

      }else{

          var rs = "Ocorreu um erro.";
          if(retorno){
              rs = "Mensagem enviada com Sucesso!"
          }

          res.status(200).send({'retorno':rs});
          return;

      }


   }else{

      res.status(200).send({'retorno':false});

   }
 
};



/* notificações */
exports.notificacoes = async function(){

  
  var notificacao = {'instancia':undefined, webhook:undefined};


      /* verificar se tem notificação se houver retornar dados da instancia e a notificação */
      instancias.forEach(function(item){

        if(item.webhook){
            notificacao.instancia = item.name;
            notificacao.webhook = item.webhook;
           // console.log(notificacao.webhook);
            /* inicializar webhook */
            item.webhook = undefined;
        }

      }); 


  return notificacao;

    /* ref.:  http://rcdevlabs.github.io/2015/02/11/criando-um-server-de-push-notifications-para-notificacoes-em-tempo-real-com-socket-io-e-nodejs/ */
}

/* paginas http-front */
exports.front = function(req,response){

  var page = 'index.html';

  if(req.url != '/'){

    page = req.page + '.html';

  }

    fs.readFile('./public/' + page, function(err,data){
      var statusHead = 200;
      if(err){
        statusHead = 404;
      }

      response.writeHead(statusHead,{'Content-type':'text-html; charset=utf-8'});
      response.write(data);
      response.end();

    });

}



/* enviar um post para php */
async function send_post(params){

    var postConf = confApi.send_post_php;
    var link = postConf.post_url.link;
   // console.log(params);
    if(link == undefined || link == ""){
      return;
    }

    /* verificar se precisa de autenticação */
    var autenticar = postConf.post_url.autenticar;
    var username = postConf.post_url.user;
    var password = postConf.post_url.passwd;
    var auth = "";
    
    if(autenticar == true){

      username = "umbler",
      password = "testehospedagem",    
      auth = "Basic " + new Buffer(username + ":" + password).toString("base64");

    }

    

    request.post({
        headers: {'content-type': 'application/json','Authorization' : auth},
        url: link,
        form: params
    }, function(error, response, body){
     // console.log(body)
        console.log("➡️ post enviado para endpoint!");
    });

}

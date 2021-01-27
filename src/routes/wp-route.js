
var wapi_srv = require('venom-bot');
const fs = require('fs');
var mime = require('mime-types');
var confApi = require('../../config/api');
var utils = require('../controllers/utilsWp_controller');
const ctrFile = require('../controllers/Files_controller');
var request = require('request'); /* enviar post -> php */



const { response } = require('../app');


/* variaveis globais */
var qrcode;
var instancias = []; /* {'name':'vendas','instancia':client} */
var notificacoes = [];
/* config drive chromium */
/* config timeout in line: 76 arquive: wapi_srv20\node_modules\wapi_srv\dist\controllers\browser.js */
/* configs venom */
var configs = {
  folderNameToken: "tokens", //folder name when saving tokens
  headless: true, // Headless chrome
  devtools: false, // Open devtools by default
  useChrome: true, // If false will use Chromium instance
  debug: false, // Opens a debug session
  logQR: true, // Logs QR automatically in terminal
  browserArgs: confApi.browser, // Parameters to be added into the chrome browser instance
  refreshQR: 12000, // Will refresh QR every 15 seconds, 0 will load QR once. Default is 30 seconds
  autoClose: 120000, // Will auto close automatically if not synced, 'false' won't auto close. Default is 60 seconds (#Important!!! Will automatically set 'refreshQR' to 1000#)
  disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
  disableWelcome: true, // Will disable the welcoming message which appears in the beginning
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

          var path = "./" + instancia;
          var flag_dir = fs.existsSync(path);
          console.log("Pasta de sessão existe? " + flag_dir);
          if (flag_dir == true && session_rem == true) {   
            
            try{
                console.log("Removendo pasta de sessão...")
                /* remover pasta do cache da instancia */
                fs.rmdirSync(path, { recursive: true });

            }catch(err){
                console.log("Erro ao tentar remover a pasta de sessão: " + err);
            }
            

          }
       
         // fs.rmdirSync(path, { recursive: true });
         wapi_srv.create(instancia, (base64Qr, asciiQR) => {      
           

            qrcode = exportQR(base64Qr, '');            
           
           // console.log(qrcode);
         
              /* atualizar qrcode */
              instancias.forEach(function(item){
                /* VARRER O OBJECT DA INSTANCIA CRIADA E GRAVAR O QRCODE NA RESPECTIVA INSTANCIA */
                if(item.name == instancia){   

                 
                 // console.log(configs);
                  /* verificar as configurações para API */
                  if(confApi.files.return_patch_files == true){

                      var dirDestFile = __dirname + "/../../public/files/wapi/qrcodes/" + item.name + ".png";
                      fileExportQR(base64Qr,dirDestFile);

                      item.qrcode = "files/wapi/qrcodes/" + item.name + ".png";

                  }else{

                      /* atualizar o qrcode (base64) */
                      item.qrcode = qrcode;

                  }
                 
                  return;
                }

              });

            

         
        },(statusFind) => { 
          
            console.log(statusFind); 
        
        },configs).then(async function(client){


            /* gravar a instancia na variavel global após qrcode Sincronizado */
            instancias.forEach(function(item){

              if(item.name == instancia){
  
                /* atualizar o qrcode */
                item.qrcode = "syncronized";
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


             if(state == 'UNPAIRED'){

                await setup_status_action(state,'destroy',client);

             }else{

              /* qualquer outros status forçar a reconexão caso, haja perda. */
              await setup_status_action(state,'forceOn',client);

             }
                    
              
 
             
           });

           /* ouvir mensagens (tempo real conforme recebe mensagens) */
         //  console.log(client.onMessage());
          client.onAnyMessage(message => {
              console.log(message.body);
              
              /* gravar novas mensagens no hook da instancia */
              instancias.forEach( async function(item){

                  if(item.instancia == client){
                    
                     console.log(' Mensagem: ' + message);
                      
                      if(message){
                          /* nova mensagen */
                         item.webhook = message; 

                        
                        // console.log("Nova Mensagem armazenada!" + message.body);
                         /* verificar se a mensagem é um arquivo */
                        
                        

                         if(item.webhook.type !== "chat"){
                         // console.log(message);
                            /* =============== alterar conteudo de arquivo recebido (DIRETORIO, OU BASE64) ================ */
                            /* verificar as configurações para API  PARA DOWNLOAD DE ARQUIVO RECEBIDO */  
                            var msgFormated = {};  
                                                  
                               await utils.formatReceivedFile(client,message).catch( await function(res){

                                  msgFormated = res.retorno;

                              });

                              if(msgFormated){

                                item.webhook = msgFormated;

                              }else{

                                item.webhook = message;

                              }


                          }


                           /* apos formatar o formato do retorno do arquivo (arquivo ou base64) então enviar post de notificação ao sistema client */
                          if(confApi.send_post_php.active == true){
                            
                              console.log("✅ Enviando o post para o sistema cliente...");
                              
                                /* enviar object new msg para sistema php via post */
                              await send_post({'instancia':item.name,'msg':message});
                              
                              console.log("Nova Mensagem armazenada!" + message.body); 
                              /* após enviar o post marcar mensagens do remetente como lidas */
                              await client.sendSeen(message.from);

                          }

                      }
                      
                     
                  }

                  /* varrer mensaem recebida e salvar arquivo de download dentro da pasta public/files */

    
              });

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
      instancias.forEach(function(item){ 
       
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
                 
                  if (state == "UNPAIRED"){                   

                   /* remover instancia desconectada pelo usuário no smartphone */
                    if(instancias[i].instancia){

                            if(action !== 'forceOn'){

                                try{
                                  instancias[i].flag_exist = false;
                                  instancias[i].qrcode = 'despareado';

                                  process.on('SIGINT', function() {
                                    instancias[i].instancia.close();
                                  }) 
                                  console.log("❌ Usuário desconectou/removeu a sessão, despareando a instancia do cliente..." + instancias[i].name);
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
async function getQcodeIntance(instancia){
      var qrc = "";
      instancias.forEach(function(item){

        if(item.name == instancia){
         
          /* atualizar o qrcode */         
          qrc = item.qrcode;
        }

      });   

      return qrc;

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
                      
                      var retorno = await utils.formatReceivedFile(inst,requisicao).catch( await function(res){
                          console.log(res)
                          return res.retorno;

                      });

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
              'arquivo': requisicao.arquivo,
              'msg': msg
            };

           

            result = await ctrFile.formatFilesSend(pars).then( async function(rs){
                       
                        return rs;

                    }).catch((erro) => {
                        console.error('Error na tentativa de enviar mensagem com arquivo: ', erro); //return object error
                        return erro;
                        
                    });


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
      qrcode = await getQcodeIntance(requisicao.instancia);

      /* pegar status */
      status = "UNPAIRED";
         
      if(qrcode){

        return res.status(200).json({'instancia':requisicao.instancia,'qrcode':qrcode, 'status':status});
    
      }else{

        return res.status(200).json({'instancia':requisicao.instancia,'qrcode':'wait...', 'status':status});

      }
  

  }else if(consulta.flag_exist == true){

     /* pegar qrcode da instancia criada */
     qrcode = await getQcodeIntance(requisicao.instancia);
     inst = consulta.instancia; /* pull de instancias */
    
     if(inst){

        // Is connected
        status = await inst.isConnected();
        
        console.log("Status consulta wp: " + status);

     }
    
     return res.status(200).json({'instancia':requisicao.instancia,'qrcode':qrcode, 'status':status});
     
  }else{

    return res.status(200).json({'instancia':requisicao.instancia,'qrcode':qrcode, 'status':status});

  }
  
}

/* listar instancias ativas */
exports.get_instancias = async function(req,res){
  var requisicao = req.body;
  var insts = [];
  var status = "";
  var consulta = {};
  var proms;

 proms = new Promise( function(resolve, reject){
    insts = [];
    instancias.forEach( async function(item){

        consulta = await verify_instance(item.name);
     
      if(consulta.flag_exist == true){

        var inst = consulta.instancia;
        
        // Is connected
        if(inst){
          status = await inst.isConnected();
        }

        if(item.name){

           /* inserir item ao arrayObject instancias para retorno */
          insts.push({'nome':item.name, 'status':status});  

        }
       
      }

      

  });

  //console.log(insts);
    resolve(insts);

})

proms.then((rs) => { 

  //console.log(rs);
  res.status(200).send({'retorno':insts})

});

 
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

  var consulta = await verify_instance(requisicao.instancia);
  var status = "Inexistente";

  /* verificar se instancia foi informada */
  if(!requisicao.instancia || requisicao.instancia == undefined || requisicao.instancia == ""){
      res.status(200).send({'instancia':requisicao.instancia,'status':status, 'error':'Digite um nome para instancia!'});
  }

  
      for(var i =0;i < instancias.length; i++){
       
        if(instancias[i].name == requisicao.instancia){
          instancias.splice(i, 1);
          
         // instancias[i].qrcode = "";
         // instancias[i].status = "removed";
          status = "DISCONECTED";     
        }

      }



  if(consulta.flag_exist == true){

    var inst = consulta.instancia;
    
    if(inst){


          // Try-catch close
        

        /* fechar/remover sessão  */
         /* remover o registro da instancia na global - instancias = [{}] */
         for(var i =0;i < instancias.length; i++){

              if(instancias[i].name == requisicao.instancia){
                instancias.splice(i, 0); /* remover item (instancia) */

                status = "DISCONECTED";
                console.log("Entrou...");           
                
              }

              try {

                process.on('SIGINT', function() {
                  inst.close();
                });

                console.log("instância fechada (close)...");
                
              }catch (error) {
                
                console.log("erro ao destruir a sessão, continuando...");

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
      console.log(body)
    });

}

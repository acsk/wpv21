'use strict'
const readline = require("readline");

exports.listTestingAllFunctions = async function(WAPI){


    rl.question("❓❔ Deseja gerar lista de verificação das funções? ", function(yesOrNo) {

        if(yesOrNo.toLowercase() == "y"){

            let todoFound = false;
            WAPI.forEach((todo) => {
                if (todo.title === title) {
                    todo.completed = true;
                    todoFound = true;
                    return;
                }
            });

            if (!todoFound) {
                throw new Error(`No TODO was found with the title: "${title}"`);
            }


        }
        rl.question("Where do you live ? ", function(country) {
            console.log(`${name}, is a citizen of ${country}`);
            rl.close();
        });
    });

}


/* função teste */
async function complete(title) {

    let todoFound = false;
    WAPI.forEach((todo) => {
        if (todo.title === title) {
            todo.completed = true;
            todoFound = true;
            return;
        }
    });

    if (!todoFound) {
        throw new Error(`No TODO was found with the title: "${title}"`);
    }
}
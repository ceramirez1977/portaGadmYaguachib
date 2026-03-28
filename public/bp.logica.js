
let paymentCheckout={};
let objetoparametro={};

let numero_id;
let estado_pantalla = 'NUEVO';

//document.addEventListener("DOMContentLoaded", async () =>{
    
    const params = new URLSearchParams(window.location.search);
    if(params.has("id"))
    {
            const id = params.get('id');                         
            console.log('id',id);
            paymentCheckout = new PaymentCheckout.modal({
            env_mode: "stg", 
            onOpen: function(){},
            onClose: async () => {
              console.log('funcion salir : estado_pantalla'+estado_pantalla);
              if(estado_pantalla!='EXITO')
              {
                const response = {
                  error: {
                    type: 'Salio del boton del pago en linea',
                    help: 'Tiene que volver a consultar',
                    description: 'Ha salido de la pagina del boton de pago en linea por cuenta propia'
                  }
                };
                let cadena = JSON.stringify(response); 
                alert('Close: '+cadena);
              } 
            },
            onResponse: async (response) =>  { // The callback to invoke when the Checkout process is completed
                estado_pantalla = 'CONSULTO';
                let cadena = JSON.stringify(response);                             
                try
                {
                  const { transaction } = response;
                  const { status} = transaction;                
                  if(status === 'success')
                  {
                    estado_pantalla = 'EXITO';                                      
                  }
                  else{
                    estado_pantalla = 'ERROR';                  
                  }
                }
                catch(error)
                {
                  estado_pantalla = 'ERROR03';                  
                }  
                alert(estado_pantalla);            
             }
            
           });         
          
            try{
              paymentCheckout.open({reference: id });
             }
            catch(err){
                alert('Hubo un error al cargar el boton de pagon con los datos de envio ',parametro,err);
             }
        
    }
    else{
        alert('Error');
    }     

    //});


window.addEventListener('popstate', () => {
  paymentCheckout.close();
});

document.body.addEventListener('unload',()=>{
     //eliminar recurso que fue enviado para cobrar
  paymentCheckout.close();
});




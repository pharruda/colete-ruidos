

var gps = [];
var gravar = true;
var media = null;
var database = null;
var url = 'recording_hibrido.3gpp';

var buttonGravar = document.getElementById("recorder");

var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
        database = firebase.database();
    },

    onDeviceReady: function() {
        this.receivedEvent('deviceready');
    },

    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');
        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
        console.log('Received Event: ' + id);
    },

    /**
    * Função para iniciar a gravação do áudio
    **/
    recorder: function() {
        if(gravar){
            // instancia o plugin "cordova-plugin-media"          
            media = new Media(url);
            // inicia a gravação
            media.startRecord();
            buttonGravar.value="gravando...";
            gravar = false;
        } else {
            this.stop();
            gravar = true;
        }
    },

    /**
    * Função para parar a gravação do áudio
    **/
    stop: function() {
        //para a gravação
        media.stopRecord();
        media.release();
        buttonGravar.value="Grave um audio";
        //envia as informações para o Firebase
        this.sendFirebase();
    },


    dialogAlert: function(msg, tit) {
       var message = msg;
       var title = tit;
       var buttonName = "OK";
       navigator.notification.alert(message, alertCallback, title, buttonName);
       
       function alertCallback() {
          console.log("Alert is Dismissed!");
       }
    },

    sendFirebase : function() {
        var dbRef = firebase.database().ref();
        var storageRef = firebase.storage().ref('hibrido');
        var audioFile = cordova.file.externalRootDirectory + url;
        this.getFileContentAsBase64(audioFile,function(base64Image){
            var uploadTask = storageRef.child((new Date()).getTime()+'.3gpp')
                                .putString(base64Image, 'data_url');        
            uploadTask.on('state_changed',
                function(snapshot){
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    alert('Upload is ' + progress + '% done');
                },
                function(error) {},
                function() {
                    //Utilizada do plugin "cordova-plugin-geolocation" para coletar a localização
                    navigator.geolocation.getCurrentPosition(
                        function(position) {
                            var d = new Date();

                            dbRef.child('hibrido').push({
                                latitude : position.coords.latitude,
                                longitude : position.coords.longitude,
                                urlArquivo : uploadTask.snapshot.downloadURL, 
                                dataColeta : d.toLocaleDateString()+" "+d.toLocaleTimeString()
                            });
                        }, 
                        function(error) {
                            console.log('Code : '+ error.code);
                        }
                    ); 
                    app.dialogAlert(
                        "Recomendamos que você colete mais ruidos em outros ambientes publicos!",
                        "Obrigado por contribuir!"
                    );
                }
            );
        });      
    },

    getFileContentAsBase64: function(path,callback){
        window.resolveLocalFileSystemURL(path, gotFile, fail);
                
        function fail(e) {
              alert('Cannot found requested file');
        }

        function gotFile(fileEntry) {
               fileEntry.file(function(file) {
                  var reader = new FileReader();
                  reader.onloadend = function(e) {
                       var content = this.result;
                       callback(content);
                  };
                  // The most important point, use the readAsDatURL Method from the file plugin
                  reader.readAsDataURL(file);
               });
        }
    }

};



app.initialize();
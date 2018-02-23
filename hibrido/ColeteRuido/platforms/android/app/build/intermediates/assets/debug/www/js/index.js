

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

    recorder: function() {
        if(gravar){          
            media = new Media(url);
            media.startRecord();
            buttonGravar.value="gravando...";
            gravar = false;
        } else {
            this.stop();
            gravar = true;
        }
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

            var uploadTask = storageRef.child((new Date()).getTime()+'.3gpp').putString(base64Image, 'data_url');
        
            uploadTask.on('state_changed',

                function(snapshot){
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    alert('Upload is ' + progress + '% done');
                },

                function(error) {},
                function() {
                    //pega posição
                    navigator.geolocation.getCurrentPosition(
                        function(position) {
                            var d = new Date();

                            dbRef.child('hibrido').push({
                                latitude : position.coords.latitude,
                                longitude : position.coords.longitude,
                                urlArquivo : uploadTask.snapshot.downloadURL, 
                                dataColeta : d.toDateString()
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

    stop: function() {
        media.stopRecord();
        media.release();
        buttonGravar.value="Grave um audio";
        this.sendFirebase();
    },

    generateUUID: function() {

        var d = new Date().getTime();

        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
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
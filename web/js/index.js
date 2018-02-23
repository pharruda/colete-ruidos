
var capture = document.getElementById('capture');

var latitude;
var longitude;

capture.onchange = function(files) {
    //armazena o audio coletado
	var file = capture.files[0];

	 if (navigator || navigator.geolocation) {
        //pega a localização
        navigator.geolocation.getCurrentPosition(
        	function(position) {
	        	latitude=position.coords.latitude;
                longitude=position.coords.longitude;
                //armazena as informações no Firebase
        		app.sendFirebase(file);
        	},

        	function() {
        		alert('erro');
        	}
        )        
    } else {
    	alert('não conseguimos pegar a localização!');
        console.log("Geolocation is not supported by this browser.");
    };
                
	
}

var app = {

    sendFirebase : function(file) {
        var dbRef = firebase.database().ref();
        var storageRef = firebase.storage().ref('web');

        var uploadTask = storageRef.child((new Date()).getTime()+'.3gpp').put(file);
        
        uploadTask.on('state_changed',
            function(snapshot){
                var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            },

            function(error) {},

            function() {                    
                var urlArq = uploadTask.snapshot.downloadURL;
                var d = new Date();
               
                dbRef.child('web').push(
                {
                    latitude : latitude,
                    longitude : longitude,
                    urlArquivo : urlArq,
                    dataColeta : d.toLocaleDateString()+" "+d.toLocaleTimeString()
                });

                var display = document.getElementById('mensagem');

            }

        );   
    }
};

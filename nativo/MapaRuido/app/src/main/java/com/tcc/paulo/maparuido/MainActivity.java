package com.tcc.paulo.maparuido;

import android.Manifest;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.pm.PackageManager;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Environment;
import android.support.annotation.NonNull;
import android.support.v4.app.ActivityCompat;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.OnProgressListener;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;

import java.io.File;
import java.io.IOException;
import java.text.DecimalFormat;
import java.util.UUID;

public class MainActivity extends AppCompatActivity implements LocationListener {

    private static final String LOG_TAG = "MainActivity";
    private static final int REQUEST_RECORD_AUDIO_PERMISSION = 200;
    private  String audioFile = Environment.getExternalStorageDirectory().getAbsoluteFile() + "/recording.3gpp";

    private MediaRecorder recorder = null;
    private LocationManager mLocationManager;

    private static final String LOG_FIREBASE = "SendFirebase";
    private DatabaseReference mDatabase;
    private FirebaseStorage mStorage = FirebaseStorage.getInstance("gs://coleteruidos.appspot.com");
    private StorageReference storage;

    private boolean permissionToRecordAccepted = false;
    private String [] permissions = {Manifest.permission.RECORD_AUDIO};

    /**
     * Longitude e latitude
     */
    private double longitude;
    private double latitude;


    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        switch (requestCode){
            case REQUEST_RECORD_AUDIO_PERMISSION:
                permissionToRecordAccepted  = grantResults[0] == PackageManager.PERMISSION_GRANTED;
                break;
        }
        if (!permissionToRecordAccepted ) finish();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        final Button gravar = findViewById(R.id.gravar);

        ActivityCompat.requestPermissions(this, permissions, REQUEST_RECORD_AUDIO_PERMISSION);

        gravar.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if(gravar.getText().toString().equals("Grave um Audio")) {
                    try {
                        //inicia gravação
                        onRecord();
                    } catch (Exception e) {
                        e.getStackTrace();
                    }
                    gravar.setText("Parar Gravaçao");
                } else {
                    try {
                        //inicia gravação
                        stopRecording();
                    }catch (Exception e) {
                        e.getStackTrace();
                    }
                    gravar.setText("Grave um Audio");
                }

            }
        });
    }

    /**
     * Pega a localização do dispositivo no momento da coleta do ruido
     */
    public void LocalizacaoGPS(){
        mLocationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        Criteria criteria = new Criteria();
        String provider = mLocationManager.getBestProvider(criteria, false);
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        Location location = mLocationManager.getLastKnownLocation(provider);

        if(location != null) {
            latitude = location.getLatitude();
            longitude = location.getLongitude();
            //Toast.makeText(getApplicationContext(),latitude.toString(), Toast.LENGTH_LONG).show();
            onLocationChanged(location);
        }
    }

    /**
     * Inicia a aravação do audio
     */
    private void onRecord() throws IOException {
        if(recorder == null) {
            recorder = new MediaRecorder();
            recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            recorder.setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP);
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB);
            recorder.setOutputFile(audioFile);
            recorder.prepare();
            recorder.start();
        }
    }

    /**
     * Para gravação do áudio
     */
    private void stopRecording() {
        LocalizacaoGPS();
        recorder.stop();
        recorder.reset();
        recorder.release();
        recorder = null;
        Log.d(LOG_TAG, "parou gravação");
        Log.d(LOG_TAG, "Local do audio : "+audioFile);
        this.sendFileStorage(new File(audioFile), latitude, longitude);
    }


    public void insertDatabase(String localFile, double latitude, double longitude) {
        Model model = new Model(localFile, latitude, longitude);
        mDatabase = FirebaseDatabase.getInstance().getReference();
        String id = mDatabase.push().getKey();
        mDatabase.child("nativo").child(id).setValue(model);
        Log.d(LOG_FIREBASE, "Gravou no Database");
    }

    public void sendFileStorage(File file, final double latitude, final double longitude) {
        final AlertDialog.Builder alert = new AlertDialog.Builder(this);
        Uri arq = Uri.fromFile(file);
        storage = mStorage.getReference();
        storage.child("nativo").child(UUID.randomUUID()+".3gpp").putFile(arq)
                .addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
                    @Override
                    public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
                        Uri downloadUrl = taskSnapshot.getDownloadUrl();
                        insertDatabase(downloadUrl.toString(), latitude, longitude);
                        alert.setTitle("Obrigado por contribuir!");
                        alert.setMessage("Recomendamos que você colete mais ruidos em outros ambientes publicos!");
                        alert.show();
                    }
                })
                .addOnFailureListener(new OnFailureListener() {
                    @Override
                    public void onFailure(@NonNull Exception exception) {
                        alert.setTitle("Ops!");
                        alert.setMessage("Ocorre um erro durante o envio, tente novamente!");
                        Log.d(LOG_FIREBASE, "error:" + exception.getMessage());
                        Toast.makeText(getApplicationContext(), "Error :" + exception.getMessage(), Toast.LENGTH_LONG);
                        alert.show();
                    }
                })
                .addOnProgressListener(new OnProgressListener<UploadTask.TaskSnapshot>() {
                    @Override
                    public void onProgress(UploadTask.TaskSnapshot taskSnapshot) {
                        double progress = (100.0*taskSnapshot.getBytesTransferred()/taskSnapshot
                                .getTotalByteCount());
                        Toast.makeText(getApplicationContext(), "enviando: "+(int)progress+"%", Toast.LENGTH_LONG);
                    }
                })
        ;
    }

    @Override
    public void onLocationChanged(Location location) {

    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {

    }

    @Override
    public void onProviderEnabled(String provider) {

    }

    @Override
    public void onProviderDisabled(String provider) {

    }
}

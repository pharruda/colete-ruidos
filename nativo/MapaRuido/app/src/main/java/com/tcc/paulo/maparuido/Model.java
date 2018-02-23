package com.tcc.paulo.maparuido;

import android.net.Uri;

import java.text.SimpleDateFormat;
import java.util.Date;

public class Model {

    private Double Latitude;
    private Double Longitude;
    private String urlArquivo;
    private String dataColeta;
    private SimpleDateFormat formataData = new SimpleDateFormat("dd-MM-yyyy HH:mm:ss");

    public Model(){

    }

    public Model(String arquivo, Double latitude, Double longitude) {
        this.Latitude = latitude;
        this.Longitude = longitude;
        this.urlArquivo = arquivo;

        Date data = new Date();
        this.dataColeta = this.formataData.format(data);
    }

    public Double getLatitude() {
        return Latitude;
    }

    public Double getLongitude() {
        return Longitude;
    }

    public String getUrlArquivo() {
        return urlArquivo;
    }

    public String getDataColeta() {
        return dataColeta;
    }
}

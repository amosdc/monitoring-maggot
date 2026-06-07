#include <WiFi.h>
#include <WiFiMulti.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ================= KONFIGURASI =================

WiFiMulti wifiMulti;

// 1. MQTT (HiveMQ Cloud)
const char* mqtt_server = "";
const int mqtt_port = ;
const char* mqtt_user = "";
const char* mqtt_password = "";
const char* mqtt_topic = "maggot/sensor";
const char* device_id = "ESP32-MF-001";

// 2. Sensor DHT
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// 3. Interval Pengiriman (ms)
const long interval = 5000; // Kirim tiap 5 detik
unsigned long previousMillis = 0;

// ===============================================

WiFiClientSecure espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.println("Menyiapkan koneksi Wi-Fi...");

  // Tambahkan daftar Wi-Fi (Bisa lebih dari satu!)
  // ESP32 otomatis akan memilih sinyal yang paling kuat atau yang tersedia
  wifiMulti.addAP("", "");
  // wifiMulti.addAP("HOTSPOT_GURU", "passwordguru123");
  // wifiMulti.addAP("WIFI_CADANGAN", "passwordcadangan");

  Serial.print("Mencari WiFi...");
  
  // Tunggu sampai terhubung ke salah satu WiFi di atas
  while (wifiMulti.run() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi terhubung!");
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID()); // Menampilkan nama WiFi yang berhasil nyambung
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // HiveMQ Cloud butuh sertifikat Root, tapi untuk kemudahan kita bisa skip verifikasi.
  espClient.setInsecure();
}

void reconnect() {
  // Loop terus sampai terhubung
  while (!client.connected()) {
    // Pastikan WiFi masih nyambung sebelum coba MQTT
    if (wifiMulti.run() != WL_CONNECTED) {
        Serial.println("WiFi terputus! Mencoba nyambung ulang ke WiFi...");
        delay(1000);
        continue;
    }

    Serial.print("Mencoba koneksi MQTT...");
    
    // Attempt to connect
    if (client.connect(device_id, mqtt_user, mqtt_password)) {
      Serial.println("Terhubung ke HiveMQ Cloud!");
    } else {
      Serial.print("Gagal, rc=");
      Serial.print(client.state());
      Serial.println(" Coba lagi dalam 5 detik...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  
  setup_wifi();
  
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    float hum = dht.readHumidity();
    float temp = dht.readTemperature();

    if (isnan(hum) || isnan(temp)) {
      Serial.println("Gagal membaca dari sensor DHT!");
      return;
    }

    // Buat JSON payload
    StaticJsonDocument<256> doc;
    doc["device_id"] = device_id;
    doc["temp"] = temp;
    doc["hum"] = hum;
    doc["led"] = true; // Contoh status LED
    
    JsonArray alerts = doc.createNestedArray("alerts");
    if (temp > 35.0) {
      alerts.add("TEMP_HIGH");
    } else if (temp < 20.0) {
      alerts.add("TEMP_LOW");
    }

    char buffer[256];
    serializeJson(doc, buffer);

    Serial.print("Mengirim data: ");
    Serial.println(buffer);

    client.publish(mqtt_topic, buffer);
  }
}

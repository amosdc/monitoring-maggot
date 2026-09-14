#include <WiFi.h>
#include <WiFiMulti.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ================= KONFIGURASI =================

WiFiMulti wifiMulti;

// 1. MQTT (HiveMQ Cloud) - KREDENSIAL ASAL (JANGAN DIUBAH!)
const char* mqtt_server = "";
const int mqtt_port = ;
const char* mqtt_user = "";
const char* mqtt_password = "";
const char* mqtt_topic = "";
const char* device_id = "";

// 2. Sensor DHT
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// 3. LED Pins
const int LED_1 = 5; // LED 1 (Alarm Visual) - Menyala jika Suhu > 35°C ATAU Kelembapan < 50%
const int LED_2 = 2; // LED 2 (Built-in LED) - Berkedip saat coba Wi-Fi/MQTT, menyala stabil saat terhubung

// 4. Interval Pengiriman (ms)
const long interval = 5000; // Kirim tiap 5 detik
unsigned long previousMillis = 0;

// ===============================================

WiFiClientSecure espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.println("Menyiapkan koneksi Wi-Fi...");

  // Tambahkan daftar Wi-Fi (Sesuai setelan asal)
  wifiMulti.addAP("ahmad", "ahmadfaris");

  Serial.print("Mencari WiFi...");
  
  // Tunggu sampai terhubung ke salah satu WiFi di atas
  while (wifiMulti.run() != WL_CONNECTED) {
    // Kedipkan LED 2 (System Status) saat mencari Wi-Fi
    digitalWrite(LED_2, HIGH);
    delay(250);
    digitalWrite(LED_2, LOW);
    delay(250);
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
        setup_wifi();
        continue;
    }

    Serial.print("Mencoba koneksi MQTT...");
    
    // Kedipkan LED 2 (Built-in) lebih cepat saat mencoba menghubungkan ke broker MQTT
    digitalWrite(LED_2, HIGH);
    delay(200);
    digitalWrite(LED_2, LOW);
    delay(200);
    
    // Attempt to connect
    if (client.connect(device_id, mqtt_user, mqtt_password)) {
      Serial.println("Terhubung ke HiveMQ Cloud!");
      digitalWrite(LED_2, HIGH); // Nyala stabil ketika sukses terhubung ke MQTT
    } else {
      Serial.print("Gagal, rc=");
      Serial.print(client.state());
      Serial.println(" Coba lagi dalam 5 detik...");
      
      // Matikan LED status selama masa tunggu reconnect
      digitalWrite(LED_2, LOW);
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  // Inisialisasi LED Pins
  pinMode(LED_1, OUTPUT);
  pinMode(LED_2, OUTPUT);
  digitalWrite(LED_1, LOW);
  digitalWrite(LED_2, LOW);
  
  dht.begin();
  
  setup_wifi();
  
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Pastikan LED 2 menyala stabil saat sistem normal & terhubung ke MQTT
  digitalWrite(LED_2, HIGH);

  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    float hum = dht.readHumidity();
    float temp = dht.readTemperature();

    if (isnan(hum) || isnan(temp)) {
      Serial.println("Gagal membaca dari sensor DHT!");
      return;
    }

    // 1. Program LED 1 (Alarm Visual)
    // Menyala jika suhu melebihi 35°C atau kelembapan < 50% (terlalu rendah)
    bool isAlarmActive = false;
    if (temp > 35.0 || hum < 50.0) {
      digitalWrite(LED_1, HIGH);
      isAlarmActive = true;
    } else {
      digitalWrite(LED_1, LOW);
      isAlarmActive = false;
    }

    // Buat JSON payload
    StaticJsonDocument<256> doc;
    doc["device_id"] = device_id;
    doc["temp"] = temp;
    doc["hum"] = hum;
    doc["led"] = isAlarmActive; // Mengirimkan status alarm LED 1 aktual ke database
    
    JsonArray alerts = doc.createNestedArray("alerts");
    if (temp > 35.0) {
      alerts.add("TEMP_HIGH");
    } else if (temp < 25.0) {
      alerts.add("TEMP_LOW");
    }
    
    if (hum > 80.0) {
      alerts.add("HUM_HIGH");
    } else if (hum < 50.0) {
      alerts.add("HUM_LOW");
    }

    char buffer[256];
    serializeJson(doc, buffer);

    Serial.print("Mengirim data: ");
    Serial.println(buffer);

    client.publish(mqtt_topic, buffer);
  }
}

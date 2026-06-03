import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Button,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();

  // QR Scanner
  const [scannedData, setScannedData] = useState(null);
  const [isScanning, setIsScanning] = useState(true);

  // Lokasi
  const [locationStatus, setLocationStatus] = useState("checking");
  const [distance, setDistance] = useState(0);

  // Titik Kampus
  const KAMPUS_LAT = -6.346;
  const KAMPUS_LON = 107.149;
  const MAKSIMAL_JARAK_METER = 50;

  // Backend
  const BASE_URL = "http://10.81.253.207:8080/api/presensi";

  useEffect(() => {
    if (permission?.granted) {
      verifyLocation();
    }
  }, [permission]);

  // =========================
  // HITUNG JARAK (HAVERSINE)
  // =========================
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;

    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;

    const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(p1) *
        Math.cos(p2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // =========================
  // CEK LOKASI
  // =========================
  const verifyLocation = async () => {
    try {
      setLocationStatus("checking");

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Akses Ditolak",
          "Izin lokasi wajib diberikan untuk presensi.",
        );

        setLocationStatus("error");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const jarakMeter = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        KAMPUS_LAT,
        KAMPUS_LON,
      );

      setDistance(Math.round(jarakMeter));

      if (jarakMeter <= MAKSIMAL_JARAK_METER) {
        setLocationStatus("valid");
      } else {
        setLocationStatus("invalid");
      }
    } catch (error) {
      console.log(error);

      Alert.alert("Error Lokasi", "Gagal mendapatkan lokasi GPS.");

      setLocationStatus("error");
    }
  };

  // =========================
  // QR SCANNER
  // =========================
  const handleBarCodeScanned = ({ data }) => {
    if (!isScanning) return;

    setIsScanning(false);

    try {
      const qrData = JSON.parse(data);

      setScannedData(qrData);

      Alert.alert(
        "QR Code Terdeteksi",
        `Mata Kuliah: ${qrData.kodeMk}
Pertemuan: ${qrData.pertemuanKe}
Ruangan: ${qrData.ruangan}

Lanjutkan Presensi?`,
        [
          {
            text: "Batal",
            style: "cancel",
            onPress: () => {
              setScannedData(null);
              setIsScanning(true);
            },
          },
          {
            text: "Ya, Check In",
            onPress: () => handleSubmitPresensi(qrData),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "QR Tidak Valid",
        "Pastikan QR yang dipindai adalah QR Presensi.",
      );

      setIsScanning(true);
    }
  };

  // =========================
  // SUBMIT PRESENSI
  // =========================
  const handleSubmitPresensi = async (qrData) => {
    const payload = {
      kodeMk: qrData.kodeMk,
      nimMhs: "0325260031",
      pertemuanKe: qrData.pertemuanKe,
      date: new Date().toISOString().split("T")[0],
      jamPresensi: new Date().toLocaleTimeString("en-GB"),
      status: "Present",
      ruangan: qrData.ruangan,
    };

    try {
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Berhasil!", "Presensi berhasil dicatat.", [
          {
            text: "Lihat Riwayat",
            onPress: () => navigation.navigate("HistoryTab"),
          },
        ]);
      } else {
        Alert.alert("Gagal", result.message || "Terjadi kesalahan di server.");
      }
    } catch (error) {
      console.log(error);

      Alert.alert("Error Jaringan", "Backend tidak dapat diakses.");
    } finally {
      setScannedData(null);
      setIsScanning(true);
    }
  };

  // =========================
  // LOADING CAMERA PERMISSION
  // =========================
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // =========================
  // CAMERA DENIED
  // =========================
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.infoText}>
          Aplikasi membutuhkan akses kamera untuk scan QR.
        </Text>

        <TouchableOpacity
          style={styles.buttonRequest}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Aktifkan Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // =========================
  // GPS CHECKING
  // =========================
  if (locationStatus === "checking") {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0056b3" />

        <Text style={styles.loadingText}>Memverifikasi Lokasi Anda...</Text>

        <Text style={{ color: "gray", marginTop: 10 }}>
          Pastikan GPS aktif dan berada di area kampus.
        </Text>
      </View>
    );
  }

  // =========================
  // GPS ERROR
  // =========================
  if (locationStatus === "error") {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="gps-off" size={80} color="#dc3545" />

        <Text style={styles.errorTitle}>GPS Tidak Tersedia</Text>

        <Text style={styles.errorSubtitle}>
          Tidak dapat mendapatkan lokasi Anda.
        </Text>

        <TouchableOpacity style={styles.buttonRequest} onPress={verifyLocation}>
          <Text style={styles.buttonText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // =========================
  // DI LUAR RADIUS
  // =========================
  if (locationStatus === "invalid") {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="block" size={80} color="#dc3545" />

        <Text style={styles.errorTitle}>Akses Ditolak</Text>

        <Text style={styles.errorSubtitle}>
          Anda berada {distance} meter dari titik kampus.
          {"\n"}
          Maksimal jarak yang diperbolehkan adalah {MAKSIMAL_JARAK_METER} meter.
        </Text>

        <TouchableOpacity style={styles.buttonRequest} onPress={verifyLocation}>
          <Text style={styles.buttonText}>Cek Ulang Lokasi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // =========================
  // SCANNER
  // =========================
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barCodeTypes: ["qr"],
        }}
      />

      <View style={[styles.overlay, StyleSheet.absoluteFillObject]}>
        <View style={styles.unfocusedContainer}>
          <View style={styles.validLocationBadge}>
            <MaterialIcons
              name="check-circle"
              size={18}
              color="white"
              style={{ marginRight: 5 }}
            />

            <Text style={styles.validLocationText}>
              Lokasi Valid ({distance}m)
            </Text>
          </View>
        </View>

        <View style={styles.focusedContainer}>
          <View style={styles.borderCornerTopLeft} />
          <View style={styles.borderCornerTopRight} />
          <View style={styles.borderCornerBottomLeft} />
          <View style={styles.borderCornerBottomRight} />
        </View>

        <View style={styles.unfocusedContainer}>
          <Text style={styles.scanText}>Arahkan Kamera ke QR Code Dosen</Text>

          {!isScanning && (
            <Button
              title="Scan Lagi"
              onPress={() => setIsScanning(true)}
              color="#ffc107"
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f6f9",
    padding: 20,
  },

  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },

  infoText: {
    color: "#333",
    textAlign: "center",
    margin: 30,
    fontSize: 16,
  },

  buttonRequest: {
    backgroundColor: "#0056b3",
    padding: 15,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#dc3545",
    marginVertical: 10,
  },

  errorSubtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    lineHeight: 24,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  unfocusedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  focusedContainer: {
    width: 250,
    height: 250,
    alignSelf: "center",
    backgroundColor: "transparent",
    position: "relative",
  },

  scanText: {
    color: "white",
    fontSize: 16,
    marginTop: 20,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 5,
  },

  validLocationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(40,167,69,0.9)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 30,
  },

  validLocationText: {
    color: "white",
    fontWeight: "bold",
  },

  borderCornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderColor: "#007bff",
  },

  borderCornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderColor: "#007bff",
  },

  borderCornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderColor: "#007bff",
  },

  borderCornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderColor: "#007bff",
  },
});

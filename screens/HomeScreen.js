import React, { useState, useEffect, useMemo, useRef, useContext } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

const HomeScreen = ({ navigation }) => {
  const { userData } = useContext(AuthContext);

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState("Memuat jam...");
  const [note, setNote] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const noteInputRef = useRef(null);

  // GANTI DENGAN IP LAPTOP SENDIRI
  const BASE_URL = "http://10.1.13.239:8080/api/presensi";

  const attendanceStats = useMemo(() => {
    return {
      totalPresent: 12,
      totalAbsent: 2,
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("id-ID", {
          hour12: false,
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = async () => {
    if (isCheckedIn) {
      return Alert.alert("Perhatian", "Anda sudah Check In.");
    }

    if (note.trim() === "") {
      Alert.alert("Peringatan", "Catatan kehadiran wajib diisi!");
      noteInputRef.current.focus();
      return;
    }

    setIsPosting(true);

    const now = new Date();

    const payload = {
      kodeMk: "TRPL205",
      course: "Mobile Programming",
      status: "Present",
      nimMhs: userData.nim_mhs,
      pertemuanKe: 5,
      date: now.toISOString().split("T")[0],
      jamPresensi: now.toLocaleTimeString("id-ID", {
        hour12: false,
      }),
      kodeQr: "AUTH-TRPL205-W5-XYZ987",
      ruangan: "Lab Komputer 3",
      dosenPengampu: "Tim Dosen TRPL",
      note: note,
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
        setIsCheckedIn(true);

        Alert.alert("Berhasil!", "Presensi masuk ke Database Java Spring.", [
          {
            text: "Lihat Riwayat",
            onPress: () => navigation.navigate("HistoryTab"),
          },
          {
            text: "OK",
          },
        ]);
      } else {
        Alert.alert(
          "Gagal",
          result.message || "Terjadi kesalahan di server."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error Jaringan",
        "Pastikan IP Laptop benar dan Spring Boot berjalan."
      );
      console.error(error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Attendance App</Text>
          <Text style={styles.clockText}>{currentTime}</Text>
        </View>

        {/* Student Card */}
        <View style={styles.card}>
          <View style={styles.icon}>
            <MaterialIcons name="person" size={40} color="#555" />
          </View>

          <View>
            <Text style={styles.name}>{userData.nama}</Text>
            <Text>NIM : {userData.nim_mhs}</Text>
            <Text>Class : Informatika-2B</Text>
          </View>
        </View>

        {/* Today's Class */}
        <View style={styles.classCard}>
          <Text style={styles.subtitle}>Today's Class</Text>
          <Text>Mobile Programming (TRPL205)</Text>
          <Text>08:00 - 10:00</Text>
          <Text>Lab 3</Text>

          {!isCheckedIn && (
            <TextInput
              ref={noteInputRef}
              style={styles.inputCatatan}
              placeholder="Tulis catatan (cth: Hadir lab)"
              value={note}
              onChangeText={setNote}
            />
          )}

          {isPosting ? (
            <ActivityIndicator
              size="large"
              color="#007AFF"
              style={{ marginTop: 15 }}
            />
          ) : (
            <TouchableOpacity
              style={[
                styles.button,
                isCheckedIn
                  ? styles.buttonDisabled
                  : styles.buttonActive,
              ]}
              onPress={handleCheckIn}
              disabled={isCheckedIn}
            >
              <Text style={styles.buttonText}>
                {isCheckedIn
                  ? "CHECKED IN"
                  : "CHECK IN SEKARANG"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {attendanceStats.totalPresent}
            </Text>
            <Text style={styles.statLabel}>Total Present</Text>
          </View>

          <View style={styles.statBox}>
            <Text
              style={[
                styles.statNumber,
                { color: "red" },
              ]}
            >
              {attendanceStats.totalAbsent}
            </Text>
            <Text style={styles.statLabel}>Total Absent</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#F5F5F5"
    },

    title: {
        fontSize: 24,
        fontWeight: "bold"
    },

    card: {
        flexDirection: "row",
        backgroundColor: "white",
        padding: 15,
        borderRadius: 10,
        marginBottom: 20
    },

    icon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#eee",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 15
    },

    iconStatus: {
        flexDirection: "row",
        alignItems: "center"
    },

    name: {
        fontSize: 18,
        fontWeight: "bold"
    },

    classCard: {
        backgroundColor: "white",
        padding: 15,
        borderRadius: 10,
        marginBottom: 20
    },

    subtitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10
    },

    button: {
        marginTop: 10,
        backgroundColor: "#007AFF",
        padding: 10,
        borderRadius: 8,
        alignItems: "center"
    },

    buttonText: {
        color: "white"
    },

    content: {
        padding: 20,
        paddingBottom: 40
    },

    item: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "white",
        alignItems: "center",
        padding: 12,
        borderRadius: 8,
        marginBottom: 8
    },

    course: {
        fontSize: 16
    },

    date: {
        fontSize: 12,
        color: "gray"
    },

    present: {
        color: "green",
        fontWeight: "bold",
        marginLeft: 2
    },

    absent: {
        color: "red",
        fontWeight: "bold",
        marginLeft: 2
    },

    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },

    clockText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
        fontVariant: ['tabular-nums'],
    },

    buttonActive: {
        backgroundColor: "#007AFF",
    },

    buttonDisabled: {
        backgroundColor: "#A0C4FF",
    },

    inputCatatan: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginTop:15,
        backgroundColor: '#fafafa',
    },

    statsCard: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: "white",
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },

    statBox: {
        alignItems: 'center',
    },

    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'green',
    },

    statLabel: {
        fontSize: 14,
        color: 'gray',
    },
});
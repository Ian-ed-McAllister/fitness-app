import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../src/styles/BarcodeScan.styles';
import { getFoodByBarcode, saveFood } from '../../src/db/food';
import { lookupBarcode } from '../../src/api/openFoodFacts';

type ScanState = 'scanning' | 'loading' | 'not_found';

export default function BarcodeScanScreen() {
  const { mealSlot, date } = useLocalSearchParams<{ mealSlot: string; date: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  async function handleBarcodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    setScanState('loading');

    const local = await getFoodByBarcode(data);
    if (local) {
      router.replace({ pathname: '/nutrition/food-detail', params: { foodId: local.id, mealSlot, date } });
      return;
    }

    const result = await lookupBarcode(data);
    if (result) {
      const food = await saveFood({ ...result, source: 'openfoodfacts', barcode: data });
      router.replace({ pathname: '/nutrition/food-detail', params: { foodId: food.id, mealSlot, date } });
      return;
    }

    setScanState('not_found');
  }

  function resetScan() {
    setScanned(false);
    setScanState('scanning');
  }

  if (!permission) {
    return <View style={styles.centered}><ActivityIndicator color="#00D26A" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permText}>Camera permission is required to scan barcodes.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scan Barcode</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.finder}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          {scanState === 'loading' && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.loadingText}>Looking up product...</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomArea}>
          {scanState === 'not_found' ? (
            <View style={styles.notFoundBox}>
              <Text style={styles.notFoundText}>Product not found</Text>
              <View style={styles.notFoundBtns}>
                <TouchableOpacity style={styles.retryBtn} onPress={resetScan}>
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.manualBtn} onPress={() => router.replace({ pathname: '/nutrition/manual-entry', params: { mealSlot, date } })}>
                  <Text style={styles.manualText}>Enter Manually</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.hint}>Point camera at a product barcode</Text>
          )}
        </View>
      </View>
    </View>
  );
}

import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { thongDiepLoi } from '@/shared/api/loiApi';
import { useAuth } from '@/shared/auth/AuthContext';
import { Nut } from '@/shared/ui/ui';
import { bo, chu, khoang, mau } from '@/shared/theme';

/**
 * Hiện ảnh giấy đăng ký (giống AnhGiayDangKy.tsx của web). Ảnh cần JWT (chỉ chủ xe / Admin xem được):
 * tải qua API rồi hiện dạng base64. Bấm ảnh để phóng to, xoay 90° (ảnh chụp điện thoại hay bị nằm ngang).
 * phienBan đổi (vừa tải ảnh mới) thì tải lại.
 */
export function AnhGiayDangKy({ xeId, phienBan = 0 }: { xeId: number; phienBan?: number }) {
  const { services } = useAuth();
  const [uri, setUri] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [phongTo, setPhongTo] = useState(false);

  useEffect(() => {
    let huy = false;
    setUri(null); setLoi(null);
    services.xe.layAnhGiayDangKy(xeId)
      .then((u) => { if (!huy) setUri(u); })
      .catch((e) => { if (!huy) setLoi(thongDiepLoi(e)); });
    return () => { huy = true; };
  }, [services, xeId, phienBan]);

  if (loi) return <View style={[s.anh, s.trong]}><Text style={s.mo}>{loi}</Text></View>;
  if (!uri) return <View style={[s.anh, s.trong]}><ActivityIndicator color={mau.chinh} /><Text style={s.mo}>Đang tải ảnh…</Text></View>;
  return (
    <>
      <Pressable accessibilityRole="imagebutton" accessibilityLabel="Ảnh giấy đăng ký xe, bấm để phóng to" onPress={() => setPhongTo(true)}>
        <Image source={{ uri }} style={s.anh} resizeMode="contain" />
      </Pressable>
      {phongTo && <XemAnhPhongTo uri={uri} onDong={() => setPhongTo(false)} />}
    </>
  );
}

/** Xem ảnh phóng to toàn màn hình: xoay 90°, phóng to 100% → 300% (cuộn để xem chỗ khác). Nút Đóng hoặc nút Back để đóng. */
function XemAnhPhongTo({ uri, onDong }: { uri: string; onDong: () => void }) {
  const [xoay, setXoay] = useState(0);
  const [zoom, setZoom] = useState(1);
  return (
    <Modal visible animationType="fade" onRequestClose={onDong} statusBarTranslucent>
      <SafeAreaView style={s.lopPhu}>
        <View style={s.congCu}>
          <Nut kieu="phu" nhan="−" onPress={() => setZoom((z) => Math.max(1, z - 0.5))} tat={zoom <= 1} style={s.nutNho} />
          <Text style={s.phanTram}>{Math.round(zoom * 100)}%</Text>
          <Nut kieu="phu" nhan="+" onPress={() => setZoom((z) => Math.min(3, z + 0.5))} tat={zoom >= 3} style={s.nutNho} />
          <Nut kieu="phu" nhan="Xoay ↻" onPress={() => setXoay((r) => (r + 90) % 360)} />
          <Nut nhan="Đóng" onPress={onDong} />
        </View>
        <ScrollView horizontal contentContainerStyle={s.giua}>
          <ScrollView contentContainerStyle={s.giua}>
            <Image
              source={{ uri }} resizeMode="contain" accessibilityLabel="Ảnh giấy đăng ký xe phóng to"
              style={{ width: 360 * zoom, height: 480 * zoom, transform: [{ rotate: `${xoay}deg` }] }}
            />
          </ScrollView>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  anh: { width: '100%', height: 200, borderRadius: bo.vua, backgroundColor: mau.the2 },
  trong: { alignItems: 'center', justifyContent: 'center', gap: khoang.s, padding: khoang.m },
  mo: { fontSize: chu.nho, color: mau.mo, textAlign: 'center' },
  lopPhu: { flex: 1, backgroundColor: '#101820' },
  congCu: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: khoang.s, padding: khoang.m },
  nutNho: { minWidth: 48 },
  phanTram: { color: '#ffffff', fontSize: chu.thuong, fontWeight: '700', minWidth: 52, textAlign: 'center' },
  giua: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
});

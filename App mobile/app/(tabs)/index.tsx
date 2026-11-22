import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DanhSachGoiXe } from '@/modules/trang-chu/components/TheGoiXe';
import { DanhSachXeTrongBai } from '@/modules/trang-chu/components/TheXeTrongBai';
import { ghepXeTrongBai } from '@/modules/trang-chu/ghepXeTrongBai';
import { useRaVao } from '@/modules/cong-ra-vao/RaVaoContext';
import { useThongBao } from '@/modules/thong-bao/ThongBaoContext';
import { useAuth } from '@/shared/auth/AuthContext';
import { IconThongBao, IconTiep } from '@/shared/ui/icons';
import { KhungTai } from '@/shared/ui/KhungTai';
import { LienKet } from '@/shared/ui/ui';
import { useTaiDuLieu } from '@/shared/ui/useTaiDuLieu';
import { docNgay } from '@/shared/utils/ngayGio';
import { bo, chu, khoang, mau } from '@/shared/theme';

/**
 * Trang chủ: xe đang trong bãi, gói của xe, số thông báo chưa đọc.
 * Bốn nguồn tải song song (ra-vao và số chưa đọc dùng chung với bộ theo dõi toàn app): nguồn nào lỗi thì chỉ thẻ đó báo lỗi.
 * Kéo xuống để tải lại; quay lại tab hoặc mở lại app thì tự tải lại ngầm (useTaiDuLieu).
 */
export default function TrangChuScreen() {
  const { services, phien } = useAuth();
  const timXe = useTaiDuLieu(() => services.timXe.layTimXe(), [services]);
  const raVao = useRaVao(); // dùng chung với bộ theo dõi xe ra (hỏi lại mỗi 3 giây), không gọi trùng
  const xe = useTaiDuLieu(() => services.xe.layDanhSach(), [services]);
  const { soChuaDoc, taiSoChuaDoc } = useThongBao();
  const [dangKeo, setDangKeo] = useState(false);

  async function keoTaiLai() {
    setDangKeo(true);
    await Promise.allSettled([timXe.taiLai(), raVao.taiLai(), xe.taiLai(), taiSoChuaDoc()]);
    setDangKeo(false);
  }

  const xeTrongBai = useMemo(
    () => (timXe.duLieu ? ghepXeTrongBai(timXe.duLieu.xe, raVao.duLieu?.lichSu ?? null) : []),
    [timXe.duLieu, raVao.duLieu],
  );
  // Mốc "72 giờ" tính theo giờ máy chủ (bayGio), đồng hồ điện thoại lệch cũng không sai
  const bayGio = docNgay(timXe.duLieu?.bayGio ?? raVao.duLieu?.bayGio)?.getTime() ?? Date.now();

  return (
    <SafeAreaView style={s.manHinh} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.noiDung}
        refreshControl={<RefreshControl refreshing={dangKeo} onRefresh={() => void keoTaiLai()} colors={[mau.chinh]} tintColor={mau.chinh} />}
      >
        <View>
          <Text style={s.chao}>Xin chào,</Text>
          <Text style={s.ten} accessibilityRole="header">{phien?.hoTen || 'bạn'}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${soChuaDoc} thông báo chưa đọc`}
          onPress={() => router.push('/thong-bao')}
          style={({ pressed }) => [s.oThongBao, soChuaDoc > 0 && s.oThongBaoMoi, pressed && { opacity: 0.85 }]}
        >
          <IconThongBao mau={soChuaDoc > 0 ? mau.chinhChu : mau.mo} />
          <Text style={[s.chuThongBao, soChuaDoc > 0 && { color: mau.chinhChu }]}>
            {soChuaDoc > 0 ? `${soChuaDoc} thông báo chưa đọc` : 'Không có thông báo mới'}
          </Text>
          <IconTiep mau={mau.mo} />
        </Pressable>

        <KhungTai
          tieuDe="Xe đang trong bãi" dangTai={timXe.dangTai} loi={timXe.loi} coDuLieu={!!timXe.duLieu}
          onThuLai={() => void timXe.taiLai()}
        >
          <DanhSachXeTrongBai ds={xeTrongBai} loiTrangThai={!!raVao.loi && !raVao.duLieu} />
          <LienKet nhan="Xem lịch sử ra vào" onPress={() => router.push('/ra-vao')} />
        </KhungTai>

        <Pressable accessibilityRole="button" accessibilityHint="Mở tab Xe" onPress={() => router.push('/xe')}>
          <KhungTai
            tieuDe="Gói của xe" dangTai={xe.dangTai} loi={xe.loi} coDuLieu={!!xe.duLieu}
            onThuLai={() => void xe.taiLai()} phai={<IconTiep mau={mau.mo} />}
          >
            {xe.duLieu && <DanhSachGoiXe ds={xe.duLieu} bayGio={bayGio} />}
          </KhungTai>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  manHinh: { flex: 1, backgroundColor: mau.nen },
  noiDung: { padding: khoang.l, gap: khoang.l, paddingBottom: khoang.xxl },
  chao: { fontSize: chu.thuong, color: mau.mo, marginTop: khoang.s },
  ten: { fontSize: chu.rat_lon, fontWeight: '800', color: mau.chu },
  oThongBao: {
    flexDirection: 'row', alignItems: 'center', gap: khoang.m, minHeight: 52, paddingHorizontal: khoang.l,
    borderRadius: bo.lon, borderWidth: 1, borderColor: mau.vien, backgroundColor: mau.the,
  },
  oThongBaoMoi: { borderColor: mau.chinh, backgroundColor: mau.loiNen },
  chuThongBao: { flex: 1, fontSize: chu.thuong, fontWeight: '600', color: mau.mo },
});

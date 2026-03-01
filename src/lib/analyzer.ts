import { EvaluationScores } from '@/types';
import { CRITERIA } from './criteria';

export interface AnalysisPoint {
  name: string;
  description: string;
}

export interface AnalysisResult {
  strengths: AnalysisPoint[];
  weaknesses: AnalysisPoint[];
  suggestions: string[];
}

// Bộ nhận xét thông minh cho từng tiêu chí
const ANALYSIS_DATA: Record<number, {
  strengthNote: string;
  weaknessNote: string;
  suggestion: string;
}> = {
  // === I. Vị trí & Khả năng tiếp cận ===
  1: { // Lưu lượng giao thông
    strengthNote: 'Vị trí có lưu lượng giao thông cao, giúp tăng khả năng tiếp cận khách hàng tự nhiên và tăng doanh thu take-away',
    weaknessNote: 'Lưu lượng giao thông thấp, ít khách hàng đi qua tự nhiên, khó phát triển doanh thu tự nhiên',
    suggestion: 'Đẩy mạnh marketing online, đăng ký trên các app giao hàng (GrabFood, ShopeeFood) và chạy quảng cáo mạng xã hội để bù đắp lưu lượng khách tự nhiên thấp',
  },
  2: { // Khả năng hiển thị
    strengthNote: 'Quán dễ nhìn thấy từ xa, mặt tiền nổi bật giúp thu hút khách hàng ngay từ lần đầu đi qua',
    weaknessNote: 'Quán bị che khuất, khó nhìn thấy từ đường, làm giảm khả năng thu hút khách mới',
    suggestion: 'Đầu tư bảng hiệu LED nổi bật, cờ banner hoặc biển quảng cáo đặt ở vị trí dễ thấy trên đường chính để tăng nhận diện',
  },
  3: { // Tiện ích xung quanh
    strengthNote: 'Khu vực xung quanh có nhiều tiện ích (trường học, văn phòng, chợ), tạo nguồn khách hàng ổn định',
    weaknessNote: 'Khu vực thiếu tiện ích, ít điểm thu hút người dân, nguồn khách hàng tiềm năng hạn chế',
    suggestion: 'Tập trung xây dựng cộng đồng khách hàng quen, triển khai chương trình thẻ thành viên và ưu đãi cho khách quay lại',
  },
  4: { // Chỗ đậu xe
    strengthNote: 'Có chỗ đậu xe rộng rãi, thuận tiện cho khách hàng dùng tại chỗ, tăng thời gian lưu trú và đơn hàng',
    weaknessNote: 'Thiếu chỗ đậu xe, gây bất tiện cho khách hàng, đặc biệt khách đi xe máy và ô tô',
    suggestion: 'Thương lượng thuê thêm diện tích bãi xe hoặc liên kết với bãi xe gần đó. Nếu không khả thi, tập trung vào mô hình take-away và giao hàng',
  },
  5: { // Giao thông công cộng
    strengthNote: 'Gần trạm xe buýt, ga tàu, thuận tiện tiếp cận bằng phương tiện công cộng, mở rộng tập khách hàng',
    weaknessNote: 'Xa giao thông công cộng, hạn chế khả năng tiếp cận của nhóm khách không có phương tiện cá nhân',
    suggestion: 'Tận dụng marketing nhắm vào cư dân trong bán kính 1-2km, phát triển dịch vụ giao hàng để mở rộng vùng phục vụ',
  },

  // === II. Mặt bằng & Không gian ===
  6: { // Diện tích
    strengthNote: 'Diện tích rộng rãi, phù hợp bố trí đầy đủ khu vực pha chế, phục vụ và chỗ ngồi thoải mái cho khách',
    weaknessNote: 'Diện tích quá nhỏ, khó bố trí đủ khu vực cần thiết cho vận hành quán trà sữa',
    suggestion: 'Thiết kế layout tối ưu diện tích nhỏ: quầy bar nhỏ gọn, ưu tiên take-away, sử dụng nội thất tiết kiệm không gian',
  },
  7: { // Hình dạng mặt bằng
    strengthNote: 'Mặt bằng vuông vức, dễ bố trí không gian quầy bar, khu phục vụ và chỗ ngồi hiệu quả',
    weaknessNote: 'Mặt bằng có hình dạng bất tiện (méo, nhiều góc), gây khó khăn trong việc bố trí thiết bị và chỗ ngồi',
    suggestion: 'Thuê kiến trúc sư thiết kế layout phù hợp với hình dạng mặt bằng, tận dụng các góc làm khu trưng bày hoặc chỗ ngồi riêng tư',
  },
  8: { // Mặt tiền
    strengthNote: 'Mặt tiền rộng, thoáng, tạo ấn tượng mạnh với khách hàng và giúp trưng bày thương hiệu nổi bật',
    weaknessNote: 'Mặt tiền hẹp, hạn chế khả năng thu hút khách hàng đi qua và không gian ngoài trời',
    suggestion: 'Trang trí mặt tiền bắt mắt với đèn LED, menu board ngoài trời, và sử dụng không gian trước quán một cách sáng tạo để thu hút sự chú ý',
  },
  9: { // Kết cấu & Tiện ích
    strengthNote: 'Kết cấu vững chắc, đầy đủ tiện ích (điện, nước, thoát nước), giảm chi phí cải tạo ban đầu',
    weaknessNote: 'Kết cấu yếu kém, cần đầu tư sửa chữa nhiều, tăng chi phí ban đầu đáng kể',
    suggestion: 'Lập báo giá sửa chữa chi tiết trước khi ký hợp đồng. Thương lượng với chủ nhà chia sẻ chi phí cải tạo hoặc giảm tiền thuê trong giai đoạn đầu',
  },
  10: { // Ánh sáng & Thông gió
    strengthNote: 'Ánh sáng tự nhiên tốt, không gian thoáng mát tạo cảm giác dễ chịu cho khách hàng',
    weaknessNote: 'Thiếu ánh sáng và thông gió tự nhiên, không gian bí bách ảnh hưởng trải nghiệm khách hàng',
    suggestion: 'Lắp đặt hệ thống đèn chiếu sáng ấm cúng, quạt thông gió hoặc điều hòa để cải thiện không gian. Dùng gương và vật liệu phản quang để tăng sáng',
  },

  // === III. Môi trường & Pháp lý ===
  11: { // An ninh trật tự
    strengthNote: 'Khu vực an ninh tốt, an toàn cho khách hàng và nhân viên, đặc biệt vào buổi tối',
    weaknessNote: 'Khu vực có vấn đề an ninh, ảnh hưởng đến cảm giác an toàn của khách hàng và nhân viên',
    suggestion: 'Lắp camera an ninh, đèn chiếu sáng ngoài trời, và xem xét thuê bảo vệ cho ca tối. Liên hệ công an khu vực để nắm tình hình',
  },
  12: { // Vệ sinh môi trường
    strengthNote: 'Môi trường xung quanh sạch sẽ, tạo ấn tượng tốt cho thương hiệu Phúc Tea',
    weaknessNote: 'Khu vực ô nhiễm, bẩn, ảnh hưởng tiêu cực đến hình ảnh thương hiệu và trải nghiệm khách',
    suggestion: 'Dọn dẹp khu vực trước quán thường xuyên. Đặt thùng rác và trồng cây xanh để cải thiện cảnh quan trực tiếp',
  },
  13: { // Cảnh quan xung quanh
    strengthNote: 'Cảnh quan đẹp, nhiều cây xanh, tạo không gian thư giãn phù hợp với thương hiệu trà sữa',
    weaknessNote: 'Cảnh quan xấu xung quanh, gây ảnh hưởng tiêu cực đến hình ảnh và cảm nhận của khách hàng',
    suggestion: 'Tập trung trang trí nội thất bên trong thật đẹp và chụp hình check-in để bù đắp. Dùng rèm, cây xanh và banner để che cảnh quan bên ngoài',
  },
  14: { // Giấy tờ pháp lý
    strengthNote: 'Giấy tờ pháp lý đầy đủ, hợp lệ, đảm bảo an toàn pháp lý cho kinh doanh lâu dài',
    weaknessNote: 'Giấy tờ pháp lý không rõ ràng hoặc không đầy đủ, tiềm ẩn rủi ro pháp lý',
    suggestion: 'YÊU CẦU chủ nhà bổ sung đầy đủ giấy tờ trước khi ký hợp đồng. Nhờ luật sư tư vấn kiểm tra tính pháp lý của mặt bằng',
  },
  15: { // Chủ sở hữu
    strengthNote: 'Chủ nhà uy tín, thiện chí hợp tác, tạo điều kiện thuận lợi cho kinh doanh lâu dài',
    weaknessNote: 'Chủ nhà khó làm việc, thiếu thiện chí, có thể gây khó khăn trong quá trình kinh doanh',
    suggestion: 'Soạn hợp đồng chi tiết với các điều khoản rõ ràng về quyền và nghĩa vụ hai bên. Đàm phán trước các điều kiện cải tạo, sửa chữa',
  },

  // === IV. Tiềm năng & Chi phí ===
  16: { // Giá thuê mặt bằng
    strengthNote: 'Giá thuê hợp lý so với thị trường, giúp tối ưu chi phí vận hành và tăng biên lợi nhuận',
    weaknessNote: 'Giá thuê cao, tạo áp lực tài chính lớn và giảm biên lợi nhuận kinh doanh',
    suggestion: 'Thương lượng lại giá thuê, đề xuất ký hợp đồng dài hạn để được giảm giá. Cân nhắc mặt bằng thay thế nếu giá thuê vượt 15-20% doanh thu dự kiến',
  },
  17: { // Tiềm năng phát triển
    strengthNote: 'Khu vực có tiềm năng phát triển cao, dân cư đang tăng, tạo cơ hội tăng trưởng doanh thu tương lai',
    weaknessNote: 'Khu vực ít tiềm năng phát triển, khó kỳ vọng tăng trưởng doanh thu trong tương lai',
    suggestion: 'Nghiên cứu quy hoạch khu vực: nếu có dự án hạ tầng mới (đường, khu dân cư) thì cân nhắc đầu tư sớm. Nếu khu vực suy thoái, nên tìm vị trí khác',
  },
  18: { // Khả năng cạnh tranh
    strengthNote: 'Ít đối thủ cạnh tranh trực tiếp trong khu vực, cơ hội chiếm thị phần lớn',
    weaknessNote: 'Khu vực có nhiều đối thủ cạnh tranh mạnh, khó tạo sự khác biệt và thu hút khách hàng',
    suggestion: 'Phân tích menu và giá của đối thủ, tạo sản phẩm độc quyền Phúc Tea khác biệt. Tập trung vào chất lượng phục vụ và chương trình khách hàng thân thiết',
  },
  19: { // Điều khoản hợp đồng
    strengthNote: 'Điều khoản hợp đồng rõ ràng, có lợi, bảo vệ quyền lợi kinh doanh dài hạn',
    weaknessNote: 'Điều khoản hợp đồng bất lợi hoặc thiếu rõ ràng, tiềm ẩn rủi ro cho bên thuê',
    suggestion: 'Đàm phán lại các điều khoản bất lợi, đặc biệt về thời hạn thuê (tối thiểu 3-5 năm), điều kiện tăng giá thuê, và quyền chuyển nhượng',
  },
  20: { // Linh hoạt kinh doanh
    strengthNote: 'Chủ nhà cho phép thay đổi, cải tạo linh hoạt, thuận lợi cho việc setup và vận hành quán',
    weaknessNote: 'Hạn chế trong việc cải tạo và thay đổi mặt bằng, gây khó khăn cho việc setup theo chuẩn Phúc Tea',
    suggestion: 'Thương lượng rõ ràng bằng văn bản về phạm vi được cải tạo trước khi ký hợp đồng. Đưa danh sách chi tiết các thay đổi cần thiết để chủ nhà phê duyệt',
  },
};

export function analyzeEvaluation(scores: EvaluationScores): AnalysisResult {
  const strengths: AnalysisPoint[] = [];
  const weaknesses: AnalysisPoint[] = [];

  // Phân tích điểm mạnh (score 4-5) và điểm yếu (score 1-2)
  for (const criterion of CRITERIA) {
    const score = scores[String(criterion.id)] || 0;
    const data = ANALYSIS_DATA[criterion.id];
    if (!data) continue;

    if (score >= 4) {
      strengths.push({
        name: criterion.name,
        description: data.strengthNote,
      });
    } else if (score <= 2) {
      weaknesses.push({
        name: criterion.name,
        description: data.weaknessNote,
      });
    }
  }

  // Tạo 3 gợi ý dựa trên tiêu chí có điểm thấp nhất
  const sortedCriteria = CRITERIA
    .map((c) => ({ criterion: c, score: scores[String(c.id)] || 0 }))
    .sort((a, b) => a.score - b.score);

  const suggestions: string[] = [];
  const usedIds = new Set<number>();

  for (const { criterion, score } of sortedCriteria) {
    if (suggestions.length >= 3) break;
    if (usedIds.has(criterion.id)) continue;
    if (score >= 4) continue; // Không cần gợi ý cho tiêu chí đã tốt

    const data = ANALYSIS_DATA[criterion.id];
    if (data) {
      suggestions.push(data.suggestion);
      usedIds.add(criterion.id);
    }
  }

  // Nếu tất cả tiêu chí đều tốt, thêm gợi ý chung
  if (suggestions.length === 0) {
    suggestions.push(
      'Mặt bằng đạt tiêu chuẩn tốt. Hãy tiến hành ký hợp đồng và bắt đầu setup theo chuẩn Phúc Tea',
      'Lên kế hoạch marketing khai trương sớm để tận dụng lợi thế vị trí',
      'Đào tạo nhân sự và chuẩn bị nguyên vật liệu để khai trương trong thời gian ngắn nhất'
    );
  } else if (suggestions.length < 3) {
    const fillers = [
      'Lập kế hoạch tài chính chi tiết bao gồm chi phí cải tạo, vận hành 3 tháng đầu và dự phòng rủi ro',
      'Thực hiện khảo sát thêm vào các khung giờ khác nhau (sáng, trưa, tối) để đánh giá chính xác hơn',
      'Tham khảo ý kiến từ đội ngũ Phúc Tea để có thêm góc nhìn chuyên môn trước khi quyết định',
    ];
    for (const f of fillers) {
      if (suggestions.length >= 3) break;
      suggestions.push(f);
    }
  }

  return { strengths, weaknesses, suggestions };
}

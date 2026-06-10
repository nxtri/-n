import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const INFO_PAGES = {
  about: {
    title: 'Giới thiệu',
    eyebrow: 'Về PHONGTROSIEUCAP',
    description: 'Nền tảng hỗ trợ tìm kiếm, đăng tin và quản lý phòng trọ dành cho chủ nhà và người thuê.',
    icon: 'info',
    sections: [
      {
        title: 'Mục tiêu',
        body: 'PHONGTROSIEUCAP giúp người thuê xem thông tin phòng rõ ràng hơn, còn chủ nhà có công cụ quản lý phòng, hợp đồng, hóa đơn và tin đăng trên cùng một hệ thống.'
      },
      {
        title: 'Dành cho người thuê',
        body: 'Người thuê có thể tìm phòng theo khu vực, xem ảnh, giá thuê, tiện ích, mô tả, vị trí bản đồ và thông tin liên hệ của chủ nhà.'
      },
      {
        title: 'Dành cho chủ nhà',
        body: 'Chủ nhà có thể đăng phòng, cập nhật trạng thái phòng, quản lý hợp đồng, hóa đơn, sự cố, ví và gói dịch vụ.'
      }
    ]
  },
  terms: {
    title: 'Điều khoản dịch vụ',
    eyebrow: 'Quy định sử dụng',
    description: 'Các nguyên tắc cơ bản khi sử dụng website PHONGTROSIEUCAP.',
    icon: 'gavel',
    sections: [
      {
        title: 'Thông tin đăng tải',
        body: 'Người đăng tin chịu trách nhiệm về tính chính xác của hình ảnh, giá thuê, địa chỉ, tiện ích và các thông tin liên quan đến phòng.'
      },
      {
        title: 'Hành vi không được phép',
        body: 'Không đăng tin giả, thông tin gây nhầm lẫn, nội dung vi phạm pháp luật hoặc sử dụng hệ thống để làm phiền người dùng khác.'
      },
      {
        title: 'Quản lý nội dung',
        body: 'Hệ thống có quyền ẩn, khóa hoặc yêu cầu chỉnh sửa các tin đăng có dấu hiệu sai lệch, bị phản ánh nhiều lần hoặc vi phạm quy định.'
      }
    ]
  },
  privacy: {
    title: 'Chính sách bảo mật',
    eyebrow: 'Dữ liệu người dùng',
    description: 'Cách website thu thập, sử dụng và bảo vệ thông tin tài khoản.',
    icon: 'privacy_tip',
    sections: [
      {
        title: 'Thông tin được lưu',
        body: 'Hệ thống có thể lưu thông tin tài khoản, số điện thoại, email, địa chỉ, thông tin phòng, hợp đồng, hóa đơn và các dữ liệu phát sinh trong quá trình sử dụng.'
      },
      {
        title: 'Mục đích sử dụng',
        body: 'Dữ liệu được dùng để xác thực tài khoản, hiển thị tin đăng, xử lý hợp đồng, hóa đơn, thông báo và hỗ trợ người dùng.'
      },
      {
        title: 'Bảo vệ tài khoản',
        body: 'Người dùng nên bảo mật mật khẩu, không chia sẻ tài khoản và liên hệ hỗ trợ khi phát hiện hoạt động bất thường.'
      }
    ]
  },
  help: {
    title: 'Trung tâm trợ giúp',
    eyebrow: 'Hỗ trợ sử dụng',
    description: 'Các hướng dẫn nhanh cho những thao tác phổ biến trên website.',
    icon: 'help',
    sections: [
      {
        title: 'Tìm phòng',
        body: 'Vào trang chủ, nhập khu vực cần tìm, chọn loại phòng hoặc mở bộ lọc để lọc theo địa chỉ, giá thuê, diện tích và tiện ích.'
      },
      {
        title: 'Đăng tin phòng',
        body: 'Đăng nhập bằng tài khoản chủ nhà, bấm nút Đăng tin, nhập thông tin phòng, ảnh, giá thuê, địa chỉ và chọn vị trí trên bản đồ.'
      },
      {
        title: 'Quản lý hợp đồng và hóa đơn',
        body: 'Chủ nhà vào trang Quản lý để tạo hợp đồng, lập hóa đơn, theo dõi thanh toán và xử lý các yêu cầu liên quan.'
      }
    ]
  },
  support: {
    title: 'Liên hệ hỗ trợ',
    eyebrow: 'Kênh liên hệ',
    description: 'Liên hệ quản trị viên khi cần hỗ trợ tài khoản, tin đăng, thanh toán hoặc lỗi hệ thống.',
    icon: 'support_agent',
    sections: [
      {
        title: 'Email',
        body: 'Gửi yêu cầu hỗ trợ tới xuantri6262@gmail.com. Nên mô tả rõ tài khoản, lỗi gặp phải và ảnh chụp màn hình nếu có.'
      },
      {
        title: 'Số điện thoại/Zalo',
        body: 'Liên hệ 0337377034 để được hỗ trợ nhanh hơn trong các trường hợp cần xử lý trực tiếp.'
      },
      {
        title: 'Nội dung cần cung cấp',
        body: 'Khi báo lỗi, hãy cung cấp đường dẫn trang, thời điểm xảy ra lỗi, thao tác đã thực hiện và thông báo lỗi nếu trình duyệt hiển thị.'
      }
    ]
  },
  faq: {
    title: 'Câu hỏi thường gặp',
    eyebrow: 'FAQ',
    description: 'Một số câu hỏi phổ biến khi sử dụng PHONGTROSIEUCAP.',
    icon: 'quiz',
    sections: [
      {
        title: 'Tại sao tôi không thấy ảnh phòng?',
        body: 'Có thể ảnh chưa được tải lên cloud storage, đường dẫn ảnh cũ không còn tồn tại hoặc kết nối mạng đang lỗi. Chủ nhà nên cập nhật lại ảnh phòng nếu ảnh không hiển thị.'
      },
      {
        title: 'Tại sao bản đồ không hiện vị trí?',
        body: 'Phòng cần có tọa độ latitude và longitude. Nếu chưa có, chủ nhà cần vào sửa phòng và chọn vị trí trên bản đồ.'
      },
      {
        title: 'Tôi có thể báo cáo tin đăng sai không?',
        body: 'Có. Trong trang chi tiết phòng, bấm Báo cáo tin đăng và nhập lý do để quản trị viên xem xét.'
      }
    ]
  }
};

const InfoPage = ({ pageKey }) => {
  const navigate = useNavigate();
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const page = INFO_PAGES[pageKey] || INFO_PAGES.about;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pageKey]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md flex flex-col">
      <Header
        user={user}
        onProfileClick={() => navigate(user?.role === 'ADMIN' ? '/admin' : '/dashboard')}
        handleLogout={handleLogout}
      />

      <main className="flex-grow pt-28 pb-16">
        <section className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="bg-white rounded-[32px] border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="p-8 md:p-12 border-b border-outline-variant/20 bg-surface-container-lowest">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">{page.icon}</span>
              </div>
              <p className="m-0 text-xs font-black uppercase tracking-widest text-primary">{page.eyebrow}</p>
              <h1 className="m-0 mt-3 text-3xl md:text-5xl font-black tracking-tight text-on-surface">{page.title}</h1>
              <p className="m-0 mt-4 text-base md:text-lg text-on-surface-variant leading-relaxed max-w-3xl">
                {page.description}
              </p>
            </div>

            <div className="p-8 md:p-12 space-y-6">
              {page.sections.map((section) => (
                <article key={section.title} className="rounded-3xl border border-outline-variant/20 bg-white p-6">
                  <h2 className="m-0 text-xl font-black text-on-surface">{section.title}</h2>
                  <p className="m-0 mt-3 text-on-surface-variant leading-relaxed">{section.body}</p>
                </article>
              ))}

              <div className="pt-4 flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-on-primary font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">home</span>
                  Về trang chủ
                </Link>
                <Link
                  to="/support"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-surface-container-low text-primary font-black hover:bg-primary hover:text-on-primary transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">support_agent</span>
                  Liên hệ hỗ trợ
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default InfoPage;

/**
 * Barrel file - Quản lý việc Export các Components của mục Tenant (Khách thuê)
 * Chức năng: Tập hợp tất cả các component con vào một nơi để Dashboard.jsx 
 * có thể import dễ dàng chỉ bằng một dòng code.
 */

export { default as TenantSidebar } from './TenantSidebar';   // Thanh điều hướng bên trái
export { default as ReviewModal } from './ReviewModal';       // Modal đánh giá phòng
export { default as TenantRoomsTab } from './TenantRoomsTab'; // Tab quản lý phòng & hợp đồng
export { default as TenantBillsTab } from './TenantBillsTab'; // Tab quản lý hóa đơn
export { default as TerminationModal } from './TerminationModal'; // Modal báo trả phòng

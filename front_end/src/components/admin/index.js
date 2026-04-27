/**
 * FILE: index.js
 * Chức năng: Tập hợp và xuất (export) tất cả các components thuộc phân hệ Quản trị (Admin).
 * Giúp việc import các components này ở nơi khác (như AdminDashboard) trở nên gọn gàng hơn.
 */
export { default as AdminUsersTab } from './AdminUsersTab';
export { default as AdminRoomsTab } from './AdminRoomsTab';
export { default as AdminStatsTab } from './AdminStatsTab';
export { default as AdminRegulationsTab } from './AdminRegulationsTab';
export { default as AdminSettingsTab } from './AdminSettingsTab';
export { default as ReportDetailModal } from './ReportDetailModal';
export { default as ReviewDetailModal } from './ReviewDetailModal';
export { default as AdminSubscriptionTab } from './AdminSubscriptionTab';

import { css, keyframes } from '@emotion/css';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, useTheme2, Icon } from '@grafana/ui';
import { DashboardSearchItem } from 'app/features/search/types';
import { locationService } from '@grafana/runtime';
import kbn from 'app/core/utils/kbn';
import { useLocation } from 'react-router-dom-v5-compat';
import { contextSrv } from 'app/core/services/context_srv';

// MUI Icons for dashboard tag-based icon mapping (alphabetically sorted)
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import AirIcon from '@mui/icons-material/Air';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import ArchiveIcon from '@mui/icons-material/Archive';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import BackupIcon from '@mui/icons-material/Backup';
import BadgeIcon from '@mui/icons-material/Badge';
import BarChartIcon from '@mui/icons-material/BarChart';
import BiotechIcon from '@mui/icons-material/Biotech';
import BoltIcon from '@mui/icons-material/Bolt';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import CalculateIcon from '@mui/icons-material/Calculate';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CampaignIcon from '@mui/icons-material/Campaign';
import CellTowerIcon from '@mui/icons-material/CellTower';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudIcon from '@mui/icons-material/Cloud';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ColorizeIcon from '@mui/icons-material/Colorize';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ConstructionIcon from '@mui/icons-material/Construction';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import DescriptionIcon from '@mui/icons-material/Description';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import EditNoteIcon from '@mui/icons-material/EditNote';
import EmailIcon from '@mui/icons-material/Email';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';
import EngineeringIcon from '@mui/icons-material/Engineering';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import EventIcon from '@mui/icons-material/Event';
import ExploreIcon from '@mui/icons-material/Explore';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import FactoryIcon from '@mui/icons-material/Factory';
import FeedbackIcon from '@mui/icons-material/Feedback';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterListIcon from '@mui/icons-material/FilterList';
import FolderIcon from '@mui/icons-material/Folder';
import ForestIcon from '@mui/icons-material/Forest';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FunctionsIcon from '@mui/icons-material/Functions';
import GavelIcon from '@mui/icons-material/Gavel';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import GradientIcon from '@mui/icons-material/Gradient';
import GrainIcon from '@mui/icons-material/Grain';
import GrassIcon from '@mui/icons-material/Grass';
import GridViewIcon from '@mui/icons-material/GridView';
import GroupIcon from '@mui/icons-material/Group';
import GroupsIcon from '@mui/icons-material/Groups';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import HelpIcon from '@mui/icons-material/Help';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import HubIcon from '@mui/icons-material/Hub';
import InfoIcon from '@mui/icons-material/Info';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import InsightsIcon from '@mui/icons-material/Insights';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LayersIcon from '@mui/icons-material/Layers';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import LinkIcon from '@mui/icons-material/Link';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LockIcon from '@mui/icons-material/Lock';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import MapIcon from '@mui/icons-material/Map';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import NatureIcon from '@mui/icons-material/Nature';
import NavigationIcon from '@mui/icons-material/Navigation';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import OpacityIcon from '@mui/icons-material/Opacity';
import ParkIcon from '@mui/icons-material/Park';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PersonIcon from '@mui/icons-material/Person';
import PhotoIcon from '@mui/icons-material/Photo';
import PieChartIcon from '@mui/icons-material/PieChart';
import PlumbingIcon from '@mui/icons-material/Plumbing';
import PolicyIcon from '@mui/icons-material/Policy';
import PoolIcon from '@mui/icons-material/Pool';
import PowerIcon from '@mui/icons-material/Power';
import PrintIcon from '@mui/icons-material/Print';
import PublicIcon from '@mui/icons-material/Public';
import PublishRoundedIcon from '@mui/icons-material/PublishRounded';
import PushPinIcon from '@mui/icons-material/PushPin';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import RecyclingIcon from '@mui/icons-material/Recycling';
import RouteIcon from '@mui/icons-material/Route';
import RouterIcon from '@mui/icons-material/Router';
import RuleFolderIcon from '@mui/icons-material/RuleFolder';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ScienceIcon from '@mui/icons-material/Science';
import SdStorageIcon from '@mui/icons-material/SdStorage';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import SensorsIcon from '@mui/icons-material/Sensors';
import SettingsIcon from '@mui/icons-material/Settings';
import ShareIcon from '@mui/icons-material/Share';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ShowerIcon from '@mui/icons-material/Shower';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import SortIcon from '@mui/icons-material/Sort';
import SpeedIcon from '@mui/icons-material/Speed';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import StorageIcon from '@mui/icons-material/Storage';
import StraightenIcon from '@mui/icons-material/Straighten';
import SummarizeIcon from '@mui/icons-material/Summarize';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SyncIcon from '@mui/icons-material/Sync';
import TableChartIcon from '@mui/icons-material/TableChart';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import TerrainIcon from '@mui/icons-material/Terrain';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedIcon from '@mui/icons-material/Verified';
import VideocamIcon from '@mui/icons-material/Videocam';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WarningIcon from '@mui/icons-material/Warning';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WaterfallChartIcon from '@mui/icons-material/WaterfallChart';
import WavesIcon from '@mui/icons-material/Waves';
import WbCloudyIcon from '@mui/icons-material/WbCloudy';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

// ─────────────────────────────────────────────────────────────────────────────
// Tag → MUI Icon mapping.
// Add a tag with '_icon' postfix to a dashboard in Grafana and the sidebar
// will automatically pick up the corresponding icon.
//
// See ICON_TAGS_REFERENCE.md for the full visual reference.
// ─────────────────────────────────────────────────────────────────────────────
const TAG_ICON_MAP: Record<string, React.ElementType> = {
  // ── General / Navigation ──
  home_icon: HomeIcon,
  dashboard_icon: DashboardIcon,
  explore_icon: ExploreIcon,
  search_icon: SearchIcon,
  bookmark_icon: BookmarkIcon,
  link_icon: LinkIcon,
  print_icon: PrintIcon,
  share_icon: ShareIcon,
  grid_view_icon: GridViewIcon,
  visibility_icon: VisibilityIcon,
  qr_code_icon: QrCode2Icon,
  calculator_icon: CalculateIcon,

  // ── Water & Hydrology ──
  water_drop_icon: WaterDropIcon,
  waves_icon: WavesIcon,
  humidity_icon: OpacityIcon,
  pool_icon: PoolIcon,
  rainfall_icon: GrainIcon,
  layers_icon: LayersIcon,
  plumbing_icon: PlumbingIcon,
  shower_icon: ShowerIcon,
  waterfall_chart_icon: WaterfallChartIcon,
  water_treatment_icon: FilterAltIcon,
  water_level_icon: WaterDropIcon,
  water_quality_icon: ScienceIcon,
  groundwater_icon: LayersIcon,
  streamflow_icon: WavesIcon,
  flood_icon: WavesIcon,
  drought_icon: GrainIcon,

  // ── Weather & Climate ──
  sunny_icon: WbSunnyIcon,
  temperature_icon: ThermostatIcon,
  wind_icon: AirIcon,
  cloud_icon: CloudIcon,
  cloudy_icon: WbCloudyIcon,
  storm_icon: ThunderstormIcon,
  snow_icon: AcUnitIcon,
  weather_icon: WbCloudyIcon,
  climate_icon: ThermostatIcon,
  air_quality_icon: AirIcon,

  // ── Data & Analytics ──
  data_explorer_icon: QueryStatsIcon,
  analytics_icon: AnalyticsIcon,
  bar_chart_icon: BarChartIcon,
  line_chart_icon: ShowChartIcon,
  pie_chart_icon: PieChartIcon,
  scatter_plot_icon: ScatterPlotIcon,
  equalizer_icon: EqualizerIcon,
  trending_up_icon: TrendingUpIcon,
  report_icon: AssessmentIcon,
  summary_icon: SummarizeIcon,
  insights_icon: InsightsIcon,
  table_icon: TableChartIcon,
  leaderboard_icon: LeaderboardIcon,
  bubble_chart_icon: BubbleChartIcon,
  data_usage_icon: DataUsageIcon,
  donut_chart_icon: DonutLargeIcon,
  statistics_icon: EqualizerIcon,
  query_stats_icon: QueryStatsIcon,

  // ── Maps & Location ──
  map_icon: MapIcon,
  map_explorer_icon: MapIcon,
  location_icon: LocationOnIcon,
  gps_icon: GpsFixedIcon,
  satellite_icon: SatelliteAltIcon,
  terrain_icon: TerrainIcon,
  globe_icon: PublicIcon,
  pin_icon: PushPinIcon,
  navigation_icon: NavigationIcon,
  create_site_icon: AddLocationAltIcon,
  add_location_icon: AddLocationAltIcon,
  region_icon: PublicIcon,

  // ── Stations & Sensors ──
  station_explorer_icon: SensorsIcon,
  station_icon: SensorsIcon,
  sensor_icon: SensorsIcon,
  gauge_icon: SpeedIcon,
  realtime_data_icon: SpeedIcon,
  monitoring_icon: MonitorHeartIcon,
  telemetry_icon: CellTowerIcon,
  cell_tower_icon: CellTowerIcon,
  meter_icon: StraightenIcon,
  data_logger_icon: SdStorageIcon,
  router_icon: RouterIcon,

  // ── Infrastructure ──
  dam_icon: GradientIcon,
  pipeline_icon: RouteIcon,
  tank_icon: Inventory2Icon,
  network_icon: AccountTreeIcon,
  factory_icon: FactoryIcon,
  power_icon: PowerIcon,
  solar_icon: SolarPowerIcon,
  blueprint_icon: ArchitectureIcon,
  infrastructure_icon: AccountTreeIcon,
  facility_icon: FactoryIcon,

  // ── Administration & Users ──
  admin_panel_icon: AdminPanelSettingsIcon,
  user_icon: PersonIcon,
  group_icon: GroupIcon,
  community_icon: GroupsIcon,
  settings_icon: SettingsIcon,
  security_icon: SecurityIcon,
  lock_icon: LockIcon,
  badge_icon: BadgeIcon,
  organization_icon: CorporateFareIcon,
  manage_accounts_icon: ManageAccountsIcon,
  supervisor_icon: SupervisorAccountIcon,
  verified_icon: VerifiedIcon,

  // ── Data Management ──
  upload_icon: CloudUploadIcon,
  data_downloads_icon: CloudDownloadIcon,
  download_icon: CloudDownloadIcon,
  file_upload_icon: FileUploadIcon,
  file_download_icon: FileDownloadIcon,
  database_icon: StorageIcon,
  backup_icon: BackupIcon,
  sync_icon: SyncIcon,
  archive_icon: ArchiveIcon,
  file_icon: InsertDriveFileIcon,
  folder_icon: FolderIcon,
  data_input_icon: PublishRoundedIcon,
  data_editor_icon: EditNoteIcon,
  import_icon: FileUploadIcon,
  export_icon: FileDownloadIcon,

  // ── Communication & Alerts ──
  alert_icon: NotificationsActiveIcon,
  warning_icon: WarningIcon,
  email_icon: EmailIcon,
  notification_icon: NotificationsIcon,
  announcement_icon: CampaignIcon,
  contact_support_icon: SupportAgentIcon,
  support_icon: SupportAgentIcon,
  help_icon: HelpIcon,
  info_icon: InfoIcon,
  feedback_icon: FeedbackIcon,

  // ── Time & Scheduling ──
  calendar_icon: CalendarMonthIcon,
  schedule_icon: ScheduleIcon,
  history_icon: HistoryIcon,
  timeline_icon: TimelineIcon,
  clock_icon: AccessTimeIcon,
  event_icon: EventIcon,

  // ── Environment & Nature ──
  park_icon: ParkIcon,
  forest_icon: ForestIcon,
  agriculture_icon: AgricultureIcon,
  vegetation_icon: GrassIcon,
  eco_icon: EnergySavingsLeafIcon,
  nature_icon: NatureIcon,
  recycling_icon: RecyclingIcon,
  environment_icon: ParkIcon,
  conservation_icon: EnergySavingsLeafIcon,
  soil_icon: GrassIcon,

  // ── Science & Engineering ──
  science_icon: ScienceIcon,
  lab_icon: BiotechIcon,
  engineering_icon: EngineeringIcon,
  construction_icon: ConstructionIcon,
  survey_icon: SquareFootIcon,
  sample_icon: ColorizeIcon,
  formula_icon: FunctionsIcon,
  research_icon: QueryStatsIcon,
  measurement_icon: SquareFootIcon,

  // ── Approvals & Tasks ──
  approval_manager_icon: FactCheckIcon,
  approval_icon: FactCheckIcon,
  task_complete_icon: TaskAltIcon,
  check_circle_icon: CheckCircleIcon,
  pending_icon: PendingActionsIcon,
  assignment_icon: AssignmentIcon,
  assignment_done_icon: AssignmentTurnedInIcon,
  rule_icon: RuleFolderIcon,
  policy_icon: PolicyIcon,
  compliance_icon: GavelIcon,
  rating_manager_icon: TrendingUpIcon,

  // ── Keys & Security ──
  api_key_manager_icon: VpnKeyIcon,
  key_icon: VpnKeyIcon,
  health_safety_icon: HealthAndSafetyIcon,
  energy_icon: BoltIcon,

  // ── Media & Documents ──
  camera_icon: CameraAltIcon,
  photo_icon: PhotoIcon,
  video_icon: VideocamIcon,
  document_icon: DescriptionIcon,
  list_icon: FormatListBulletedIcon,
  compare_icon: CompareArrowsIcon,
  filter_icon: FilterListIcon,
  sort_icon: SortIcon,
  hub_icon: HubIcon,
};

// ─────────────────────────────────────────────────────────────────────────────
// Unsaved-progress guard for iframe-based tool forms.
//
// Iframe forms post `{ type: 'wrd-form-dirty', dirty: boolean }` to the
// parent window whenever their form state changes. We listen once at module
// level and track dirty state. The DashboardCard component uses React state
// to show a styled modal instead of a native confirm dialog.
// ─────────────────────────────────────────────────────────────────────────────
let _formDirty = false;
let _listenerInstalled = false;

function installDirtyFormListener() {
  if (_listenerInstalled || typeof window === 'undefined') {
    return;
  }
  _listenerInstalled = true;
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.data?.type === 'wrd-form-dirty' && typeof event.data.dirty === 'boolean') {
      _formDirty = event.data.dirty;
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Modern unsaved-changes modal (replaces native window.confirm)
// ─────────────────────────────────────────────────────────────────────────────
function UnsavedChangesModal({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  const theme = useTheme2();
  const isDark = theme.colors.mode === 'dark';

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onStay();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onStay]);

  const fadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
  `;

  const slideUp = keyframes`
    from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  `;

  const styles = {
    backdrop: css({
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(6px)',
      animation: `${fadeIn} 0.2s ease-out`,
    }),
    card: css({
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10001,
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      borderRadius: '16px',
      padding: '32px',
      textAlign: 'center',
      animation: `${slideUp} 0.25s cubic-bezier(0.16, 1, 0.3, 1)`,
      background: isDark
        ? 'linear-gradient(170deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%)'
        : 'linear-gradient(170deg, #ffffff 0%, #f8fafc 100%)',
      border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(203, 213, 225, 0.8)'}`,
      boxShadow: isDark
        ? '0 24px 80px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        : '0 24px 80px rgba(15, 23, 42, 0.12), 0 8px 32px rgba(15, 23, 42, 0.08)',
    }),
    iconCircle: css({
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      background: isDark
        ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.15) 100%)'
        : 'linear-gradient(135deg, rgba(255, 237, 213, 1) 0%, rgba(254, 215, 170, 1) 100%)',
      border: `1.5px solid ${isDark ? 'rgba(251, 191, 36, 0.35)' : 'rgba(251, 191, 36, 0.5)'}`,
      boxShadow: isDark
        ? '0 4px 16px rgba(251, 191, 36, 0.2)'
        : '0 4px 16px rgba(251, 191, 36, 0.15)',
    }),
    title: css({
      fontSize: '18px',
      fontWeight: 700,
      color: isDark ? 'rgba(248, 250, 252, 0.95)' : 'rgba(15, 23, 42, 0.95)',
      marginBottom: '10px',
      letterSpacing: '-0.01em',
    }),
    description: css({
      fontSize: '14px',
      lineHeight: 1.6,
      color: isDark ? 'rgba(148, 163, 184, 0.9)' : 'rgba(100, 116, 139, 0.95)',
      marginBottom: '28px',
    }),
    buttonRow: css({
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
    }),
    btnBase: css({
      padding: '10px 24px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      outline: 'none',
      '&:focus-visible': {
        outline: `2px solid ${theme.colors.primary.main}`,
        outlineOffset: '2px',
      },
    }),
    stayBtn: css({
      background: isDark
        ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(59, 130, 246, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(219, 234, 254, 1) 0%, rgba(191, 219, 254, 1) 100%)',
      color: isDark ? 'rgba(147, 197, 253, 1)' : 'rgba(37, 99, 235, 1)',
      border: `1.5px solid ${isDark ? 'rgba(96, 165, 250, 0.35)' : 'rgba(147, 197, 253, 0.8)'}`,
      '&:hover': {
        background: isDark
          ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.25) 0%, rgba(59, 130, 246, 0.3) 100%)'
          : 'linear-gradient(135deg, rgba(191, 219, 254, 1) 0%, rgba(147, 197, 253, 1) 100%)',
        transform: 'translateY(-1px)',
        boxShadow: isDark
          ? '0 4px 12px rgba(96, 165, 250, 0.3)'
          : '0 4px 12px rgba(59, 130, 246, 0.2)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
    }),
    leaveBtn: css({
      background: isDark
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(254, 226, 226, 1) 0%, rgba(254, 202, 202, 1) 100%)',
      color: isDark ? 'rgba(252, 165, 165, 1)' : 'rgba(185, 28, 28, 1)',
      border: `1.5px solid ${isDark ? 'rgba(248, 113, 113, 0.35)' : 'rgba(252, 165, 165, 0.8)'}`,
      '&:hover': {
        background: isDark
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.3) 100%)'
          : 'linear-gradient(135deg, rgba(254, 202, 202, 1) 0%, rgba(252, 165, 165, 1) 100%)',
        transform: 'translateY(-1px)',
        boxShadow: isDark
          ? '0 4px 12px rgba(239, 68, 68, 0.3)'
          : '0 4px 12px rgba(239, 68, 68, 0.2)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
    }),
  };

  return ReactDOM.createPortal(
    <>
      <div className={styles.backdrop} onClick={onStay} />
      <div className={styles.card} role="alertdialog" aria-modal="true" aria-labelledby="unsaved-title" aria-describedby="unsaved-desc">
        <div className={styles.iconCircle}>
          <WarningAmberIcon sx={{ fontSize: 28, color: isDark ? 'rgba(251, 191, 36, 0.9)' : 'rgba(217, 119, 6, 0.9)' }} />
        </div>
        <div id="unsaved-title" className={styles.title}>Unsaved Changes</div>
        <div id="unsaved-desc" className={styles.description}>
          You have unsaved progress on this form.<br />
          Leaving now will discard your changes.
        </div>
        <div className={styles.buttonRow}>
          <button className={`${styles.btnBase} ${styles.stayBtn}`} onClick={onStay} autoFocus>
            Stay on Page
          </button>
          <button className={`${styles.btnBase} ${styles.leaveBtn}`} onClick={onLeave}>
            Leave Page
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

interface DashboardCardProps {
  dashboard: DashboardSearchItem;
  onClick?: () => void;
}

export function DashboardCard({ dashboard, onClick }: DashboardCardProps) {
  const location = useLocation();
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const pendingNavRef = useRef<(() => void) | null>(null);

  // Install the postMessage listener once (idempotent)
  useEffect(() => {
    installDirtyFormListener();
  }, []);

  // Check if user is admin or super admin
  const isSuperAdmin = Boolean((contextSrv.user as any).isSuperAdmin ?? contextSrv.user.isGrafanaAdmin);
  const isOrgAdmin = contextSrv.hasRole('Admin');
  const isRestrictedUser = !isOrgAdmin && !isSuperAdmin;
  
  // Check if dashboard has "admin" tag
  const hasAdminTag = dashboard.tags?.some(tag => tag.toLowerCase() === 'admin') ?? false;
  
  // Show as admin-restricted (red) if user is restricted AND dashboard has admin tag
  const isAdminRestricted = isRestrictedUser && hasAdminTag;
  
  const styles = useStyles2((theme) => getStyles(theme, isAdminRestricted));

  // Resolve MUI icon from dashboard tags (tags with '_icon' postfix)
  const getMuiIcon = (): React.ElementType | null => {
    const iconTag = dashboard.tags?.find((tag) => tag.endsWith('_icon'));
    return iconTag ? TAG_ICON_MAP[iconTag] ?? null : null;
  };

  const MuiIconComponent = getMuiIcon();

  // Build the dashboard URL
  let dashboardUrl = '';
  if (dashboard.uid && dashboard.title) {
    const slug = kbn.slugifyForUrl(dashboard.title);
    dashboardUrl = `/d/${dashboard.uid}/${slug}`;
  } else if (dashboard.uid) {
    dashboardUrl = `/d/${dashboard.uid}`;
  } else if (dashboard.url) {
    dashboardUrl = dashboard.url;
  }

  // Check if this dashboard is currently active
  // Use exact UID matching to avoid substring issues (e.g., df0svp0xkecqod vs df0svp0xkecqod21)
  const currentPathParts = location.pathname.split('/');
  const currentDashboardUid = currentPathParts[2]; // /d/{uid}/... format
  const isActive = dashboard.uid && currentDashboardUid === dashboard.uid;

  const doNavigate = useCallback(() => {
    if (onClick) {
      onClick();
    }

    // For non-admin users, if the dashboard is already loaded, refresh iframes
    // without doing a full page reload (keeps sidebar/topbar intact)
    if (isRestrictedUser && isActive) {
      const dashboardContainer = document.querySelector('.react-grid-layout');
      if (dashboardContainer) {
        const iframes = dashboardContainer.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
          const currentSrc = iframe.src;
          if (currentSrc) {
            const url = new URL(currentSrc, window.location.origin);
            url.searchParams.set('_refresh', Date.now().toString());
            iframe.src = url.toString();
          }
        });
      }
      return;
    }

    if (dashboardUrl) {
      locationService.push(dashboardUrl);
    }
  }, [onClick, isRestrictedUser, isActive, dashboardUrl]);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Guard: show modal if an iframe form has unsaved progress
    if (_formDirty) {
      pendingNavRef.current = doNavigate;
      setShowUnsavedModal(true);
      return;
    }

    doNavigate();
  };

  const handleStay = useCallback(() => {
    setShowUnsavedModal(false);
    pendingNavRef.current = null;
  }, []);

  const handleLeave = useCallback(() => {
    _formDirty = false;
    setShowUnsavedModal(false);
    if (pendingNavRef.current) {
      pendingNavRef.current();
      pendingNavRef.current = null;
    }
  }, []);


  // Render modern list item design
  const renderDashboardItem = () => {
    return (
      <div className={styles.listItem}>
        <div className={`${styles.iconContainer} icon-container`}>
          {MuiIconComponent ? (
            <MuiIconComponent className={`${styles.dashboardIcon} dashboard-icon`} sx={{ fontSize: 22 }} />
          ) : (
            <Icon name="dashboard" size="lg" className={`${styles.dashboardIcon} dashboard-icon`} />
          )}
        </div>
        
        <div className={styles.content}>
          <div className={styles.title}>
            {dashboard.title}
          </div>
        </div>
        
        <div className={styles.actions}>
          <Icon name="arrow-right" size="sm" className={`${styles.arrowIcon} arrow-icon`} />
        </div>
      </div>
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event as any);
    }
  };

  return (
    <>
      <div
        className={`${styles.container} ${isActive ? styles.active : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        {renderDashboardItem()}
      </div>
      {showUnsavedModal && <UnsavedChangesModal onStay={handleStay} onLeave={handleLeave} />}
    </>
  );
}

const getStyles = (theme: GrafanaTheme2, isAdminRestricted: boolean = false) => {
  const isDarkTheme = theme.colors.mode === 'dark';
  
  // Red/warning colors for admin-restricted dashboards
  const adminRestrictedColors = {
    primary: isDarkTheme ? 'rgba(248, 113, 113, 1)' : 'rgba(220, 38, 38, 1)', // red-400/red-600
    primaryLight: isDarkTheme ? 'rgba(252, 165, 165, 1)' : 'rgba(239, 68, 68, 1)', // red-300/red-500
    bgLight: isDarkTheme ? 'rgba(248, 113, 113, 0.15)' : 'rgba(254, 226, 226, 1)', // red tint
    bgLighter: isDarkTheme ? 'rgba(248, 113, 113, 0.08)' : 'rgba(254, 242, 242, 1)',
    border: isDarkTheme ? 'rgba(248, 113, 113, 0.4)' : 'rgba(252, 165, 165, 0.6)',
    borderHover: isDarkTheme ? 'rgba(248, 113, 113, 0.6)' : 'rgba(239, 68, 68, 0.4)',
    shadow: isDarkTheme ? 'rgba(248, 113, 113, 0.3)' : 'rgba(239, 68, 68, 0.2)',
    iconBg: isDarkTheme ? 'rgba(248, 113, 113, 0.25)' : 'rgba(254, 202, 202, 0.9)',
  };
  
  return {
    container: css({
      width: '100%',
      cursor: 'pointer',
      
      '&:focus': {
        outline: `2px solid ${isAdminRestricted ? adminRestrictedColors.primary : theme.colors.primary.main}`,
        outlineOffset: '2px',
        borderRadius: theme.shape.radius.default,
      },
    }),

    active: css({
      '& > div': {
        backgroundColor: isDarkTheme 
          ? (isAdminRestricted ? 'rgba(248, 113, 113, 0.2)' : 'rgba(96, 165, 250, 0.2)')
          : (isAdminRestricted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'),
        background: isDarkTheme
          ? (isAdminRestricted 
              ? 'linear-gradient(135deg, rgba(248, 113, 113, 0.25) 0%, rgba(239, 68, 68, 0.3) 100%)'
              : 'linear-gradient(135deg, rgba(96, 165, 250, 0.25) 0%, rgba(59, 130, 246, 0.3) 100%)')
          : (isAdminRestricted
              ? 'linear-gradient(135deg, rgba(254, 226, 226, 1) 0%, rgba(254, 202, 202, 1) 100%)'
              : 'linear-gradient(135deg, rgba(219, 234, 254, 1) 0%, rgba(191, 219, 254, 1) 100%)'),
        borderLeft: `3px solid ${isDarkTheme 
          ? (isAdminRestricted ? 'rgba(248, 113, 113, 1)' : 'rgba(96, 165, 250, 1)') 
          : (isAdminRestricted ? 'rgba(239, 68, 68, 1)' : 'rgba(59, 130, 246, 1)')}`,
        borderColor: isDarkTheme 
          ? (isAdminRestricted ? 'rgba(248, 113, 113, 0.4)' : 'rgba(96, 165, 250, 0.4)') 
          : (isAdminRestricted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'),
        boxShadow: isDarkTheme 
          ? (isAdminRestricted 
              ? '0 4px 16px rgba(248, 113, 113, 0.35), 0 2px 8px rgba(0, 0, 0, 0.3)'
              : '0 4px 16px rgba(96, 165, 250, 0.35), 0 2px 8px rgba(0, 0, 0, 0.3)') 
          : (isAdminRestricted
              ? '0 3px 10px rgba(239, 68, 68, 0.15), 0 1px 4px rgba(239, 68, 68, 0.1)'
              : '0 3px 10px rgba(59, 130, 246, 0.15), 0 1px 4px rgba(59, 130, 246, 0.1)'),
        
        '& .icon-container': {
          backgroundColor: isDarkTheme 
            ? (isAdminRestricted ? 'rgba(248, 113, 113, 0.35)' : 'rgba(96, 165, 250, 0.35)') 
            : (isAdminRestricted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'),
          borderColor: isDarkTheme 
            ? (isAdminRestricted ? 'rgba(248, 113, 113, 0.5)' : 'rgba(96, 165, 250, 0.5)') 
            : (isAdminRestricted ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'),
          boxShadow: isDarkTheme
            ? (isAdminRestricted 
                ? '0 4px 12px rgba(248, 113, 113, 0.45)'
                : '0 4px 12px rgba(96, 165, 250, 0.45)')
            : (isAdminRestricted
                ? '0 2px 6px rgba(239, 68, 68, 0.2)'
                : '0 2px 6px rgba(59, 130, 246, 0.2)'),
        },
        
        '& .dashboard-icon': {
          color: isDarkTheme 
            ? (isAdminRestricted ? 'rgba(252, 165, 165, 1)' : 'rgba(147, 197, 253, 1)') 
            : (isAdminRestricted ? 'rgba(185, 28, 28, 1)' : 'rgba(37, 99, 235, 1)'),
          filter: isDarkTheme
            ? (isAdminRestricted 
                ? 'drop-shadow(0 2px 4px rgba(248, 113, 113, 0.6))'
                : 'drop-shadow(0 2px 4px rgba(96, 165, 250, 0.6))')
            : (isAdminRestricted
                ? 'drop-shadow(0 1px 2px rgba(239, 68, 68, 0.4))'
                : 'drop-shadow(0 1px 2px rgba(59, 130, 246, 0.4))'),
        },
        
        '& .arrow-icon': {
          opacity: 1,
          color: isDarkTheme 
            ? (isAdminRestricted ? 'rgba(252, 165, 165, 1)' : 'rgba(147, 197, 253, 1)') 
            : (isAdminRestricted ? 'rgba(185, 28, 28, 1)' : 'rgba(37, 99, 235, 1)'),
        },
      },
    }),
    
    listItem: css({
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(1, 1.25),
      margin: theme.spacing(0.375, 0),
      borderRadius: `${theme.shape.radius.default}px`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      border: `1.5px solid ${isAdminRestricted ? adminRestrictedColors.border : 'transparent'}`,
      borderLeft: `3px solid ${isAdminRestricted ? adminRestrictedColors.primary : 'transparent'}`,
      position: 'relative',
      overflow: 'hidden',
      
      // Gradient background - red tinted for admin restricted
      background: isDarkTheme
        ? (isAdminRestricted 
            ? 'linear-gradient(135deg, rgba(127, 29, 29, 0.4) 0%, rgba(153, 27, 27, 0.3) 100%)'
            : 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(51, 65, 85, 0.3) 100%)')
        : (isAdminRestricted
            ? 'linear-gradient(135deg, rgba(254, 242, 242, 1) 0%, rgba(254, 226, 226, 1) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 250, 251, 1) 100%)'),
      
      boxShadow: isDarkTheme
        ? (isAdminRestricted 
            ? '0 1px 3px rgba(248, 113, 113, 0.2), 0 0 0 1px rgba(248, 113, 113, 0.1)'
            : '0 1px 3px rgba(0, 0, 0, 0.15)')
        : (isAdminRestricted
            ? '0 1px 2px rgba(239, 68, 68, 0.1), 0 0 0 1px rgba(239, 68, 68, 0.05)'
            : '0 1px 2px rgba(15, 23, 42, 0.06)'),
      
      // Shimmer effect
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: isAdminRestricted
          ? 'linear-gradient(90deg, transparent, rgba(248, 113, 113, 0.1), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
        transition: 'left 0.5s ease',
        pointerEvents: 'none',
        zIndex: 1,
      },
      
      '&:hover': {
        backgroundColor: isDarkTheme 
          ? (isAdminRestricted ? 'rgba(248, 113, 113, 0.15)' : 'rgba(96, 165, 250, 0.15)') 
          : (isAdminRestricted ? 'rgba(254, 226, 226, 1)' : 'rgba(241, 245, 249, 1)'),
        background: isDarkTheme
          ? (isAdminRestricted
              ? 'linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(239, 68, 68, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(59, 130, 246, 0.2) 100%)')
          : (isAdminRestricted
              ? 'linear-gradient(135deg, rgba(254, 226, 226, 1) 0%, rgba(254, 202, 202, 1) 100%)'
              : 'linear-gradient(135deg, rgba(248, 250, 252, 1) 0%, rgba(241, 245, 249, 1) 100%)'),
        borderLeft: `3px solid ${isDarkTheme 
          ? (isAdminRestricted ? 'rgba(248, 113, 113, 0.9)' : 'rgba(96, 165, 250, 0.9)') 
          : (isAdminRestricted ? 'rgba(239, 68, 68, 0.9)' : 'rgba(100, 116, 139, 0.9)')}`,
        borderColor: isDarkTheme 
          ? (isAdminRestricted ? 'rgba(248, 113, 113, 0.25)' : 'rgba(96, 165, 250, 0.25)') 
          : (isAdminRestricted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(203, 213, 225, 0.5)'),
        transform: 'translateX(4px)',
        boxShadow: isDarkTheme 
          ? (isAdminRestricted
              ? '0 4px 16px rgba(248, 113, 113, 0.3), 0 2px 8px rgba(0, 0, 0, 0.25)'
              : '0 4px 16px rgba(96, 165, 250, 0.3), 0 2px 8px rgba(0, 0, 0, 0.25)') 
          : (isAdminRestricted
              ? '0 3px 10px rgba(239, 68, 68, 0.15), 0 1px 4px rgba(239, 68, 68, 0.08)'
              : '0 3px 10px rgba(15, 23, 42, 0.08), 0 1px 4px rgba(15, 23, 42, 0.04)'),
        
        '&::before': {
          left: '100%',
        },
        
        '& .icon-container': {
          transform: 'scale(1.08)',
          backgroundColor: isDarkTheme 
            ? (isAdminRestricted ? 'rgba(248, 113, 113, 0.3)' : 'rgba(96, 165, 250, 0.3)') 
            : (isAdminRestricted ? 'rgba(254, 202, 202, 1)' : 'rgba(100, 116, 139, 0.15)'),
          boxShadow: isDarkTheme
            ? (isAdminRestricted 
                ? '0 4px 12px rgba(248, 113, 113, 0.4)'
                : '0 4px 12px rgba(96, 165, 250, 0.4)')
            : (isAdminRestricted
                ? '0 2px 6px rgba(239, 68, 68, 0.2)'
                : '0 2px 6px rgba(15, 23, 42, 0.12)'),
        },
        
        '& .dashboard-icon': {
          transform: 'scale(1.12)',
          filter: isDarkTheme
            ? (isAdminRestricted
                ? 'drop-shadow(0 2px 4px rgba(248, 113, 113, 0.5))'
                : 'drop-shadow(0 2px 4px rgba(96, 165, 250, 0.5))')
            : 'none',
        },
        
        '& .arrow-icon': {
          opacity: 1,
          transform: 'translateX(4px)',
          color: isDarkTheme 
            ? (isAdminRestricted ? 'rgba(252, 165, 165, 1)' : 'rgba(147, 197, 253, 1)') 
            : (isAdminRestricted ? 'rgba(185, 28, 28, 1)' : 'rgba(71, 85, 105, 1)'),
        },
      },
      
      '&:active': {
        transform: 'translateX(2px)',
        transition: 'all 0.1s ease-out',
      },
    }),
    
    iconContainer: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: theme.spacing(4.5),
      height: theme.spacing(4.5),
      marginRight: theme.spacing(1.25),
      borderRadius: `${theme.shape.radius.default}px`,
      backgroundColor: isDarkTheme 
        ? (isAdminRestricted ? adminRestrictedColors.iconBg : 'rgba(96, 165, 250, 0.15)') 
        : (isAdminRestricted ? adminRestrictedColors.iconBg : 'rgba(241, 245, 249, 0.9)'),
      border: `1px solid ${isDarkTheme 
        ? (isAdminRestricted ? 'rgba(248, 113, 113, 0.4)' : 'rgba(96, 165, 250, 0.3)') 
        : (isAdminRestricted ? 'rgba(252, 165, 165, 0.6)' : 'rgba(203, 213, 225, 0.6)')}`,
      boxShadow: isDarkTheme
        ? (isAdminRestricted 
            ? '0 2px 6px rgba(248, 113, 113, 0.25), inset 0 1px 0 rgba(248, 113, 113, 0.1)'
            : '0 2px 6px rgba(96, 165, 250, 0.2), inset 0 1px 0 rgba(96, 165, 250, 0.1)')
        : (isAdminRestricted
            ? '0 1px 3px rgba(239, 68, 68, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)'
            : '0 1px 3px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 1)'),
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      zIndex: 2,
    }),
    
    dashboardIcon: css({
      color: isDarkTheme 
        ? (isAdminRestricted ? 'rgba(252, 165, 165, 0.95)' : 'rgba(147, 197, 253, 0.95)') 
        : (isAdminRestricted ? 'rgba(185, 28, 28, 0.9)' : 'rgba(71, 85, 105, 0.9)'),
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      filter: isDarkTheme
        ? (isAdminRestricted
            ? 'drop-shadow(0 1px 2px rgba(248, 113, 113, 0.3))'
            : 'drop-shadow(0 1px 2px rgba(96, 165, 250, 0.3))')
        : 'none',
    }),
    
    content: css({
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
    }),
    
    title: css({
      fontSize: '13px',
      fontWeight: isAdminRestricted ? 700 : 600,
      color: isAdminRestricted 
        ? (isDarkTheme ? 'rgba(252, 165, 165, 1)' : 'rgba(185, 28, 28, 1)')
        : theme.colors.text.primary,
      lineHeight: 1.4,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      position: 'relative',
      zIndex: 2,
      transition: 'all 0.3s ease',
      letterSpacing: '0.01em',
    }),
    
    tags: css({
      display: 'flex',
      gap: theme.spacing(0.5),
      flexWrap: 'wrap',
      alignItems: 'center',
    }),
    
    tag: css({
      fontSize: '10px',
      padding: theme.spacing(0.25, 0.5),
      backgroundColor: isDarkTheme 
        ? 'rgba(255, 255, 255, 0.08)' 
        : 'rgba(0, 0, 0, 0.06)',
      color: theme.colors.text.secondary,
      borderRadius: theme.shape.radius.default,
      fontWeight: 500,
      border: `1px solid ${theme.colors.border.weak}`,
      transition: 'all 0.2s ease-in-out',
    }),
    
    tagMore: css({
      fontSize: '11px',
      padding: theme.spacing(0.25, 0.5),
      backgroundColor: theme.colors.primary.transparent,
      color: theme.colors.primary.text,
      borderRadius: theme.shape.radius.default,
      fontWeight: 600,
      border: `1px solid ${theme.colors.primary.border}`,
    }),
    
    actions: css({
      display: 'flex',
      alignItems: 'center',
      marginLeft: theme.spacing(1),
    }),
    
    arrowIcon: css({
      color: isAdminRestricted 
        ? (isDarkTheme ? 'rgba(248, 113, 113, 0.7)' : 'rgba(239, 68, 68, 0.5)')
        : theme.colors.text.secondary,
      opacity: isAdminRestricted ? 0.6 : 0.3,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: 'translateX(-4px)',
      position: 'relative',
      zIndex: 2,
      filter: isDarkTheme
        ? (isAdminRestricted 
            ? 'drop-shadow(0 1px 2px rgba(248, 113, 113, 0.3))'
            : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))')
        : (isAdminRestricted
            ? 'drop-shadow(0 0.5px 1px rgba(239, 68, 68, 0.2))'
            : 'drop-shadow(0 0.5px 1px rgba(0, 0, 0, 0.1))'),
    }),
  };
};

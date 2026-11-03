import type { en } from './en';

// Japanese, for development and testing in Japan. Not a launch language.
export const ja: Partial<typeof en> = {
  tagline: '毎時2秒。友だちと過ごした1日が、1本のVlogに。',
  getStarted: 'はじめる',
  next: '次へ',
  back: '戻る',

  nameTitle: '名前を教えてください',
  nameHint: 'グループの友だちに表示されます。',
  namePlaceholder: 'あなたの名前',

  birthdateTitle: '生年月日を入力してください',
  birthdateHint: '安全のために使います。ほかの人には表示されません。',
  birthdatePlaceholder: '20100201 のように数字で入力',
  birthdateInvalid: '正しい日付を入力してください。',
  ageBlocked: 'Loopdayは{age}歳以上の方が利用できます。',
  guardianConsent: '私は{age}歳未満で、保護者からLoopdayの利用について同意を得ています。',

  permissionsTitle: '2つの許可をお願いします',
  cameraPermission: 'カメラ',
  cameraPermissionWhy: 'グループで共有する2秒のクリップを撮影するために使います。',
  notificationPermission: '通知',
  notificationPermissionWhy: 'グループ全員に、毎時同じタイミングで撮影の合図を送るために使います。',
  privacyNote: 'クリップはグループのメンバーだけが見られます。位置情報は初期設定でオフです。',
  agreeAndContinue: '同意して続ける',
  termsLine: '続けると、利用規約とプライバシー通知に同意したことになります。',

  roomsTitle: 'あなたのグループ',
  emptyRoomsTitle: '最初の1日をはじめよう',
  emptyRoomsBody: '友だちとグループを作って、今日をいっしょに記録しよう。',
  newRoom: 'グループを作る',
  joinWithCode: 'コードで参加',
  dayBoundaryNote: '1日は午前4時から翌日の午前4時までです。',

  newRoomTitle: '新しいグループ',
  roomNamePlaceholder: 'グループ名',
  roomSize: '何人で使いますか',
  roomSizeSolo: 'ひとり',
  roomSizeSummary: 'あなた + 友だち{count}人',
  createRoom: 'グループを作る',

  tapToRecord: 'タップして撮影',
  inviteFriend: '友だちを招待',
  noClipYet: 'まだクリップなし',
  report: '通報',
};

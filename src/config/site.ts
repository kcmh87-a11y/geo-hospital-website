// Edit public brand and contact details here. Never put credentials in this file.
export const site = {
  name: '온율',
  englishName: 'ONYUL',
  tagline: '병원의 전문성을, AI가 이해하는 언어로.',
  description: 'GEO/AIO 병원 마케팅을 주제로 연구하고 쓰는 개인 전문가 온율의 기록. 전문 칼럼과 콘텐츠 포트폴리오를 통해 관점을 살펴보고 협업을 이야기해 보세요.',
  // Set real details when you are ready. Empty values keep the honest demo flow.
  email: '',
  phone: '',
  isPractice: true,
  // Add your real name and a local image path later, e.g. /images/profile.webp.
  // Empty values deliberately show a name/photo placeholder, never a fake person.
  profile: {
    name: '',
    image: '',
    role: 'GEO/AIO 병원 마케팅 · 콘텐츠 전문가',
    introduction: '병원의 전문성을 읽고, 환자의 질문을 콘텐츠로 연결합니다. 의료정보가 사람과 AI에게 더 명확하게 전달되는 방식을 탐구하고 글로 기록합니다.',
  },
};

export const authorName = site.profile.name.trim() || site.name;
export const personSchema = {
  '@type': 'Person',
  name: authorName,
  alternateName: site.englishName,
  description: `${site.profile.introduction} 미래의 전문가 모습을 가정한 연습용 프로필입니다.`,
  knowsAbout: ['GEO', 'AIO', '병원 마케팅', '의료정보 콘텐츠 전략'],
};

export const navigation = [
  { label: '전문가 소개', href: '/#about' },
  { label: '전문 칼럼', href: '/insights/' },
  { label: '콘텐츠 포트폴리오', href: '/#portfolio' },
  { label: '전문 분야', href: '/#services' },
];

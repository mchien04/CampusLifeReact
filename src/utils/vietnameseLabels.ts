/**
 * Chuẩn hóa nhãn tiếng Việt có dấu cho cấu hình điểm / preset.
 * Ưu tiên map theo mã (enum, ruleKey, fieldName, presetCode);
 * fallback: đối chiếu chuỗi không dấu từ BE.
 */

function stripDiacritics(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

/** Mã enum / trigger / audience / semester / scenario → tiếng Việt có dấu */
const CODE_LABELS: Record<string, string> = {
    // Score types
    REN_LUYEN: 'Điểm rèn luyện',
    CONG_TAC_XA_HOI: 'Điểm công tác xã hội',
    CHUYEN_DE: 'Điểm chuyên đề',

    // Triggers / rule keys
    PARTICIPATION_COMPLETED: 'Hoàn thành tham gia',
    NO_SHOW: 'Vắng mặt (không tham gia)',
    SUBMISSION_GRADED: 'Nộp bài và được chấm',
    MINIGAME_PASSED: 'Đạt minigame',
    MINIGAME_EXHAUSTED_ATTEMPTS: 'Hết lượt minigame',
    TASK_OVERDUE: 'Quá hạn nhiệm vụ',
    SERIES_MILESTONE_REACHED: 'Đạt mốc chuỗi sự kiện',

    // Calculation
    FIXED_POINTS: 'Điểm cố định',
    COUNT_COMPLETION: 'Đếm số lần hoàn thành',
    PASS_FAIL_POINTS: 'Đạt / Trượt',
    PENALTY_POINTS: 'Trừ điểm (phạt)',
    SERIES_MILESTONE: 'Mốc điểm chuỗi sự kiện',

    // Audience
    ALL_PARTICIPANTS: 'Tất cả người tham gia',
    DEPARTMENT_ONLY: 'Chỉ sinh viên khoa / ngành',
    OUTSIDE_DEPARTMENTS_ONLY: 'Sinh viên ngoài khoa / ngành',

    // Semester policy
    ACTIVITY_SEMESTER: 'Học kỳ của hoạt động',
    EXPLICIT_SEMESTER: 'Chỉ định học kỳ',

    // Preview scenarios
    PASS: 'Đạt',
    FAIL: 'Không đạt',
    PENALTY: 'Phạt',
    BONUS: 'Thưởng',
    REWARD: 'Phần thưởng',

    // Activity types (không trùng key với score type khi khác nghĩa)
    SUKIEN: 'Sự kiện',
    MINIGAME: 'Minigame',
    CHUYEN_DE_DOANH_NGHIEP: 'Chuyên đề doanh nghiệp',
};

const PRESET_DISPLAY_NAMES: Record<string, string> = {
    EVENT_BASIC: 'Sự kiện cơ bản',
    EVENT_WITH_SUBMISSION: 'Sự kiện có nộp bài',
    ENTERPRISE_SEMINAR_BASIC: 'Chuyên đề doanh nghiệp cơ bản',
    ENTERPRISE_SEMINAR_WITH_BONUS: 'Chuyên đề doanh nghiệp (có thưởng)',
    MINIGAME_PASS_ONLY: 'Minigame (chỉ tính đạt)',
    SERIES_MILESTONE_BASIC: 'Chuỗi sự kiện cơ bản',
    ENTERPRISE_SERIES: 'Chuỗi chuyên đề doanh nghiệp',
    CUSTOM: 'Tùy chỉnh',
    DEFAULT: 'Mặc định',
    NO_SUBMISSION: 'Không yêu cầu nộp bài',
    INTERNAL_ONLY: 'Nội bộ khoa',
    STRICT_ATTENDANCE: 'Điểm danh bắt buộc',
    MINIGAME_DEFAULT: 'Minigame mặc định',
    SERIES_DEFAULT: 'Chuỗi sự kiện',
};

const RULE_LABELS: Record<string, { label: string; description: string }> = {
    PARTICIPATION_COMPLETED: {
        label: 'Hoàn thành tham gia',
        description: 'Cộng điểm khi sinh viên hoàn thành tham gia sự kiện.',
    },
    NO_SHOW: {
        label: 'Vắng mặt',
        description: 'Trừ điểm khi đã đăng ký nhưng không đến tham gia.',
    },
    SUBMISSION_GRADED: {
        label: 'Nộp bài và được chấm',
        description: 'Cộng hoặc trừ điểm theo kết quả chấm bài thu hoạch.',
    },
    TASK_OVERDUE: {
        label: 'Quá hạn nhiệm vụ',
        description: 'Trừ điểm khi nộp bài / hoàn thành nhiệm vụ quá hạn.',
    },
    MINIGAME_PASSED: {
        label: 'Đạt minigame',
        description: 'Cộng điểm khi vượt qua minigame.',
    },
    MINIGAME_EXHAUSTED_ATTEMPTS: {
        label: 'Hết lượt minigame',
        description: 'Xử lý điểm khi sinh viên hết lượt chơi minigame.',
    },
    SERIES_MILESTONE_REACHED: {
        label: 'Đạt mốc chuỗi sự kiện',
        description: 'Cộng điểm khi đạt số sự kiện mốc trong chuỗi.',
    },
    SERIES_MILESTONE: {
        label: 'Điểm mốc tích lũy',
        description: 'Cộng điểm thưởng khi sinh viên đạt các mốc số lượng sự kiện con đã hoàn thành.',
    },
    MILESTONE_POINTS: {
        label: 'Điểm mốc tích lũy',
        description: 'Cộng điểm thưởng khi sinh viên đạt các mốc số lượng sự kiện con đã hoàn thành.',
    },
    MINIMUM_REQUIREMENT: {
        label: 'Yêu cầu tối thiểu',
        description: 'Phạt điểm nếu đăng ký tham gia chuỗi nhưng không đạt số sự kiện tối thiểu.',
    },
    SERIES_MINIMUM_REQUIREMENT: {
        label: 'Yêu cầu tối thiểu',
        description: 'Phạt điểm nếu đăng ký tham gia chuỗi nhưng không đạt số sự kiện tối thiểu.',
    },
    AUDIENCE: {
        label: 'Giới hạn đối tượng nhận điểm',
        description: 'Kiểm soát việc sinh viên thuộc khoa nào sẽ được cộng/trừ điểm từ chuỗi này.',
    },
    SCORE_AUDIENCE: {
        label: 'Giới hạn đối tượng nhận điểm',
        description: 'Kiểm soát việc sinh viên thuộc khoa nào sẽ được cộng/trừ điểm từ chuỗi này.',
    },
    AUDIENCE_SCOPE: {
        label: 'Giới hạn đối tượng nhận điểm',
        description: 'Kiểm soát việc sinh viên thuộc khoa nào sẽ được cộng/trừ điểm từ chuỗi này.',
    },
    BONUS_POINTS: {
        label: 'Điểm thưởng',
        description: 'Cộng thêm điểm thưởng (thường là điểm rèn luyện) khi hoàn thành tham gia.',
    },
};

/** Nhãn theo fieldName — ưu tiên hơn label thô từ BE */
const FIELD_LABELS: Record<string, string> = {
    participationPoints: 'Điểm tham gia',
    participationFailPoints: 'Điểm khi không đạt (tham gia)',
    primaryScoreType: 'Loại điểm chính',
    failScoreType: 'Loại điểm khi không đạt',
    noShowPenaltyEnabled: 'Bật phạt vắng mặt',
    noShowPenaltyPoints: 'Điểm phạt vắng mặt',
    noShowPenaltyScoreType: 'Loại điểm phạt vắng mặt',
    submissionPassPoints: 'Điểm khi đạt (nộp bài)',
    submissionFailPoints: 'Điểm khi không đạt (nộp bài)',
    submissionFailScoreType: 'Loại điểm khi không đạt (nộp bài)',
    submissionEnabled: 'Bật chế độ nộp bài',
    taskOverduePenaltyPoints: 'Điểm phạt quá hạn',
    taskOverduePenaltyScoreType: 'Loại điểm phạt quá hạn',
    bonusPoints: 'Điểm thưởng',
    minigamePassPoints: 'Điểm khi đạt minigame',
    minigameFailPoints: 'Điểm khi không đạt minigame',
    audience: 'Đối tượng áp dụng',
    departmentIds: 'Danh sách khoa',
    semesterPolicy: 'Chính sách học kỳ',
    explicitSemesterId: 'Học kỳ chỉ định',
    participationAudience: 'Đối tượng (tham gia)',
    participationDepartmentIds: 'Khoa áp dụng (tham gia)',
    participationSemesterPolicy: 'Học kỳ (tham gia)',
    participationExplicitSemesterId: 'Học kỳ chỉ định (tham gia)',
    submissionAudience: 'Đối tượng (nộp bài)',
    submissionDepartmentIds: 'Khoa áp dụng (nộp bài)',
    submissionSemesterPolicy: 'Học kỳ (nộp bài)',
    submissionExplicitSemesterId: 'Học kỳ chỉ định (nộp bài)',
    noShowAudience: 'Đối tượng (vắng mặt)',
    noShowDepartmentIds: 'Khoa áp dụng (vắng mặt)',
    noShowSemesterPolicy: 'Học kỳ (vắng mặt)',
    noShowExplicitSemesterId: 'Học kỳ chỉ định (vắng mặt)',
    taskOverdueAudience: 'Đối tượng (quá hạn)',
    taskOverdueDepartmentIds: 'Khoa áp dụng (quá hạn)',
    taskOverdueSemesterPolicy: 'Học kỳ (quá hạn)',
    taskOverdueExplicitSemesterId: 'Học kỳ chỉ định (quá hạn)',
    bonusAudience: 'Đối tượng (thưởng)',
    bonusDepartmentIds: 'Khoa áp dụng (thưởng)',
    bonusSemesterPolicy: 'Học kỳ (thưởng)',
    bonusExplicitSemesterId: 'Học kỳ chỉ định (thưởng)',
    minigamePassedAudience: 'Đối tượng (đạt minigame)',
    minigamePassedDepartmentIds: 'Khoa áp dụng (đạt minigame)',
    minigamePassedSemesterPolicy: 'Học kỳ (đạt minigame)',
    minigamePassedExplicitSemesterId: 'Học kỳ chỉ định (đạt minigame)',
    minigameExhaustedAudience: 'Đối tượng (hết lượt)',
    minigameExhaustedDepartmentIds: 'Khoa áp dụng (hết lượt)',
    minigameExhaustedSemesterPolicy: 'Học kỳ (hết lượt)',
    minigameExhaustedExplicitSemesterId: 'Học kỳ chỉ định (hết lượt)',
    milestonePoints: 'Mốc điểm theo số sự kiện',
    minimumRequirementEnabled: 'Bật yêu cầu tối thiểu',
    minimumRequiredEvents: 'Số sự kiện tối thiểu',
    minimumPenaltyPoints: 'Điểm phạt khi không đạt tối thiểu',
};

/**
 * Cụm từ không dấu / lẫn mã → có dấu.
 * Key đã qua stripDiacritics (lowercase, bỏ dấu).
 */
const PHRASE_LABELS: Record<string, string> = {
    // —— Câu mô tả / notes đầy đủ từ BE (EVENT_BASIC và tương tự) ——
    'su kien check-in/check-out va chot ket qua tham gia de cong diem hoac tru diem khi danh gia khong dat.':
        'Sự kiện check-in/check-out và chốt kết quả tham gia để cộng điểm hoặc trừ điểm khi đánh giá Không đạt.',
    'su kien check-in/check-out va chot ket qua tham gia de cong diem hoac tru diem khi danh gia khong dat':
        'Sự kiện check-in/check-out và chốt kết quả tham gia để cộng điểm hoặc trừ điểm khi đánh giá Không đạt.',
    'mac dinh sinh rule tham gia hoan thanh.':
        'Mặc định sinh rule Tham gia hoàn thành.',
    'mac dinh sinh rule tham gia hoan thanh':
        'Mặc định sinh rule Tham gia hoàn thành.',
    'mac dinh bat vang mat (khong tham gia) va tru cung score type chinh.':
        'Mặc định bật Vắng mặt (không tham gia) và trừ cùng score type chính.',
    'mac dinh bat vang mat (khong tham gia) va tru cung score type chinh':
        'Mặc định bật Vắng mặt (không tham gia) và trừ cùng score type chính.',
    'co the dung failpoints de tru diem khi manager danh gia khong dat completion.':
        'Có thể dùng failPoints để trừ điểm khi manager đánh giá Không đạt completion.',
    'co the dung failpoints de tru diem khi manager danh gia khong dat completion':
        'Có thể dùng failPoints để trừ điểm khi manager đánh giá Không đạt completion.',
    'preset chi sinh scorerules de fe/be thao tac nhanh hon; admin van co the chuyen sang custom khi can.':
        'Preset chỉ sinh scoreRules để FE/BE thao tác nhanh hơn; admin vẫn có thể chuyển sang custom khi cần.',
    'preset chi sinh scorerules de fe/be thao tac nhanh hon; admin van co the chuyen sang custom khi can':
        'Preset chỉ sinh scoreRules để FE/BE thao tác nhanh hơn; admin vẫn có thể chuyển sang custom khi cần.',
    'preset nay mac dinh bat vang mat (khong tham gia), fe co the tat bang noshowpenaltyenabled=false.':
        'Preset này mặc định bật Vắng mặt (không tham gia), FE có thể tắt bằng noShowPenaltyEnabled=false.',
    'preset nay mac dinh bat vang mat (khong tham gia), fe co the tat bang noshowpenaltyenabled=false':
        'Preset này mặc định bật Vắng mặt (không tham gia), FE có thể tắt bằng noShowPenaltyEnabled=false.',

    // —— EVENT_WITH_SUBMISSION ——
    'su kien yeu cau nop bai, cham pass/fail va co the tru diem khi qua han chua nop.':
        'Sự kiện yêu cầu nộp bài, chấm pass/fail và có thể trừ điểm khi quá hạn chưa nộp.',
    'su kien yeu cau nop bai, cham pass/fail va co the tru diem khi qua han chua nop':
        'Sự kiện yêu cầu nộp bài, chấm pass/fail và có thể trừ điểm khi quá hạn chưa nộp.',
    'mac dinh sinh rule cham bai pass/fail.':
        'Mặc định sinh rule chấm bài pass/fail.',
    'mac dinh sinh rule cham bai pass/fail':
        'Mặc định sinh rule chấm bài pass/fail.',
    'mac dinh bat vang mat (khong tham gia); penalty no-show co the cau hinh rieng va khong lien quan qua han nhiem vu.':
        'Mặc định bật Vắng mặt (không tham gia); penalty no-show có thể cấu hình riêng và không liên quan Quá hạn nhiệm vụ.',
    'co the them rule qua han nhiem vu de tru diem khi assignment qua han chua nop.':
        'Có thể thêm rule Quá hạn nhiệm vụ để trừ điểm khi assignment quá hạn chưa nộp.',
    'co the them rule qua han nhiem vu de tru diem khi assignment qua han chua nop':
        'Có thể thêm rule Quá hạn nhiệm vụ để trừ điểm khi assignment quá hạn chưa nộp.',

    // —— ENTERPRISE_SEMINAR_BASIC ——
    'tich luy buoi chuyen de doanh nghiep theo moi lan tham gia.':
        'Tích lũy buổi Chuyên đề doanh nghiệp theo mỗi lần Tham gia.',
    'tich luy buoi chuyen de doanh nghiep theo moi lan tham gia':
        'Tích lũy buổi Chuyên đề doanh nghiệp theo mỗi lần Tham gia.',
    'mac dinh cong 1 diem diem chuyen de cho moi lan tham gia hoan thanh.':
        'Mặc định cộng 1 điểm chuyên đề cho mỗi lần Tham gia hoàn thành.',
    'mac dinh cong 1 diem diem chuyen de cho moi lan tham gia hoan thanh':
        'Mặc định cộng 1 điểm chuyên đề cho mỗi lần Tham gia hoàn thành.',
    'mac dinh tat vang mat (khong tham gia) de tranh tru nguoc vao diem tich luy diem chuyen de.':
        'Mặc định tắt Vắng mặt (không tham gia) để tránh trừ ngược vào điểm tích lũy Điểm chuyên đề.',
    'mac dinh tat vang mat (khong tham gia) de tranh tru nguoc vao diem tich luy diem chuyen de':
        'Mặc định tắt Vắng mặt (không tham gia) để tránh trừ ngược vào điểm tích lũy Điểm chuyên đề.',
    'neu can tru diem ren luyen khi khong dat, co the dung failpoints tren cung rule.':
        'Nếu cần trừ điểm Rèn luyện khi Không đạt, có thể dùng failPoints trên cùng rule.',
    'neu can tru diem ren luyen khi khong dat, co the dung failpoints tren cung rule':
        'Nếu cần trừ điểm Rèn luyện khi Không đạt, có thể dùng failPoints trên cùng rule.',

    // —— ENTERPRISE_SEMINAR_WITH_BONUS ——
    'vua tich luy diem chuyen de, vua cong them diem thuong khac nhu ren luyen.':
        'Vừa tích lũy Điểm chuyên đề, vừa cộng thêm Điểm thưởng khác như Rèn luyện.',
    'vua tich luy diem chuyen de, vua cong them diem thuong khac nhu ren luyen':
        'Vừa tích lũy Điểm chuyên đề, vừa cộng thêm Điểm thưởng khác như Rèn luyện.',
    'sinh 2 rule: 1 rule diem chuyen de va 1 rule bonus.':
        'Sinh 2 rule: 1 rule Điểm chuyên đề và 1 rule bonus.',
    'sinh 2 rule: 1 rule diem chuyen de va 1 rule bonus':
        'Sinh 2 rule: 1 rule Điểm chuyên đề và 1 rule bonus.',
    'mac dinh tat vang mat (khong tham gia); neu bat thi nen tru sang score type khac nhu diem ren luyen.':
        'Mặc định tắt Vắng mặt (không tham gia); nếu bật thì nên trừ sang score type khác như Điểm rèn luyện.',
    'mac dinh tat vang mat (khong tham gia); neu bat thi nen tru sang score type khac nhu diem ren luyen':
        'Mặc định tắt Vắng mặt (không tham gia); nếu bật thì nên trừ sang score type khác như Điểm rèn luyện.',
    'dung khi su kien chuyen de vua tich luy so buoi, vua cong them diem thuong.':
        'Dùng khi Sự kiện Chuyên đề vừa tích lũy số buổi, vừa cộng thêm Điểm thưởng.',
    'dung khi su kien chuyen de vua tich luy so buoi, vua cong them diem thuong':
        'Dùng khi Sự kiện Chuyên đề vừa tích lũy số buổi, vừa cộng thêm Điểm thưởng.',

    // —— MINIGAME_PASS_ONLY ——
    'minigame chi cong diem khi dat quiz, co the tru khi het luot hoac vang mat.':
        'Minigame chỉ cộng điểm khi đạt quiz, có thể trừ khi hết lượt hoặc vắng mặt.',
    'minigame chi cong diem khi dat quiz, co the tru khi het luot hoac vang mat':
        'Minigame chỉ cộng điểm khi đạt quiz, có thể trừ khi hết lượt hoặc vắng mặt.',
    'chi cong diem khi vuot nguong minigame. diem chi lay tu lan dat.':
        'Chỉ cộng điểm khi vượt ngưỡng minigame. Điểm chỉ lấy từ lần Đạt.',
    'chi cong diem khi vuot nguong minigame. diem chi lay tu lan dat':
        'Chỉ cộng điểm khi vượt ngưỡng minigame. Điểm chỉ lấy từ lần Đạt.',
    'mac dinh sinh rule dat minigame.':
        'Mặc định sinh rule Đạt minigame.',
    'mac dinh sinh rule dat minigame':
        'Mặc định sinh rule Đạt minigame.',
    'mac dinh sinh rule dat minigame (minigame_passed).':
        'Mặc định sinh rule Đạt minigame (MINIGAME_PASSED).',
    'mac dinh sinh rule dat minigame (minigame_passed)':
        'Mặc định sinh rule Đạt minigame (MINIGAME_PASSED).',
    'mac dinh tat phat vang mat (noshowpenaltyenabled=false).':
        'Mặc định tắt phạt vắng mặt (noShowPenaltyEnabled=false).',
    'mac dinh tat phat vang mat (noshowpenaltyenabled=false)':
        'Mặc định tắt phạt vắng mặt (noShowPenaltyEnabled=false).',
    'co the bat vang mat (khong tham gia) cho sinh vien dang ky ma khong lam minigame.':
        'Có thể bật Vắng mặt (Không tham gia) cho sinh viên đăng ký mà không làm minigame.',
    'co the bat vang mat (khong tham gia) cho sinh vien dang ky ma khong lam minigame':
        'Có thể bật Vắng mặt (Không tham gia) cho sinh viên đăng ký mà không làm minigame.',

    'co the them rule het luot minigame de xu ly truong hop het luot ma van khong pass.':
        'Có thể thêm rule Hết lượt minigame để xử lý trường hợp hết lượt mà vẫn không pass.',
    'co the them rule het luot minigame de xu ly truong hop het luot ma van khong pass':
        'Có thể thêm rule Hết lượt minigame để xử lý trường hợp hết lượt mà vẫn không pass.',
    'co the bat het luot minigame de tru diem khi sinh vien het luot ma chua dat.':
        'Có thể bật Hết lượt minigame để trừ điểm khi sinh viên hết lượt mà chưa đạt.',
    'co the bat het luot minigame de tru diem khi sinh vien het luot ma chua dat':
        'Có thể bật Hết lượt minigame để trừ điểm khi sinh viên hết lượt mà chưa đạt.',
    'khong tao rule nop bai va duoc cham hoac hoan thanh tham gia cho minigame.':
        'Không tạo rule Nộp bài và được chấm hoặc Hoàn thành tham gia cho minigame.',
    'khong tao rule nop bai va duoc cham hoac hoan thanh tham gia cho minigame':
        'Không tạo rule Nộp bài và được chấm hoặc Hoàn thành tham gia cho minigame.',
    'minigame co the dung trigger dat minigame va het luot minigame.':
        'Minigame. Có thể dùng trigger Đạt minigame và Hết lượt minigame.',
    'minigame co the dung trigger dat minigame va het luot minigame':
        'Minigame. Có thể dùng trigger Đạt minigame và Hết lượt minigame.',
    'phu hop: minigame': 'Phù hợp: Minigame',
    'diem phat het luot': 'Điểm phạt hết lượt',
    'cong diem khi vuot qua minigame': 'Cộng điểm khi vượt qua minigame',

    // Minigame preview rows — cột Tình huống (BE có thể lẫn dấu / không dấu)
    'tru diem khi het luot ma khong pass': 'Trừ điểm khi hết lượt mà không pass',
    'tru diem khi het luot ma van khong pass': 'Trừ điểm khi hết lượt mà vẫn không pass',
    'tru diem khi het luot minigame ma khong pass': 'Trừ điểm khi hết lượt minigame mà không pass',
    'tru diem khi sinh vien het luot ma chua dat': 'Trừ điểm khi sinh viên hết lượt mà chưa đạt',
    'tru diem khi het luot minigame ma chua dat': 'Trừ điểm khi hết lượt minigame mà chưa đạt',
    'tru diem khi het luot ma chua dat': 'Trừ điểm khi hết lượt mà chưa đạt',
    'cong diem khi dat quiz': 'Cộng điểm khi đạt quiz',
    'cong diem khi vuot nguong minigame': 'Cộng điểm khi vượt ngưỡng minigame',
    'tru diem khi vang mat (khong tham gia)': 'Trừ điểm khi vắng mặt (không tham gia)',
    'tru diem khi da dang ky nhung vang mat': 'Trừ điểm khi đã đăng ký nhưng vắng mặt',
    'het luot ma khong pass': 'Hết lượt mà không pass',
    'het luot ma van khong pass': 'Hết lượt mà vẫn không pass',
    'khi het luot ma khong pass': 'khi hết lượt mà không pass',
    'khi het luot ma van khong pass': 'khi hết lượt mà vẫn không pass',
    'ma khong pass': 'mà không pass',
    'ma van khong pass': 'mà vẫn không pass',
    'van khong pass': 'vẫn không pass',
    'khong pass': 'không pass',
    'khi dat quiz': 'khi đạt quiz',
    'vuot nguong minigame': 'vượt ngưỡng minigame',

    // —— SERIES_MILESTONE_BASIC ——
    'dinh nghia cac moc hoan thanh va diem thuong tuong ung cho chuoi su kien.':
        'Định nghĩa các mốc hoàn thành và điểm thưởng tương ứng cho chuỗi sự kiện.',
    'dinh nghia cac moc hoan thanh va diem thuong tuong ung cho chuoi su kien':
        'Định nghĩa các mốc hoàn thành và điểm thưởng tương ứng cho chuỗi sự kiện.',
    'mac dinh scoretype la diem ren luyen.':
        'Mặc định scoreType là Điểm rèn luyện.',
    'mac dinh scoretype la diem ren luyen':
        'Mặc định scoreType là Điểm rèn luyện.',
    'phu hop cho chuoi su kien thong thuong can moc 3/5/7.':
        'Phù hợp cho chuỗi sự kiện thông thường cần mốc 3/5/7.',
    'phu hop cho chuoi su kien thong thuong can moc 3/5/7':
        'Phù hợp cho chuỗi sự kiện thông thường cần mốc 3/5/7.',
    'series preset hien tai resolve ve scoretype va milestonepoints de dung voi mo hinh series hien co.':
        'Series preset hiện tại resolve về scoreType và milestonePoints để dùng với mô hình series hiện có.',
    'series preset hien tai resolve ve scoretype va milestonepoints de dung voi mo hinh series hien co':
        'Series preset hiện tại resolve về scoreType và milestonePoints để dùng với mô hình series hiện có.',
    'preview series preset hien tai resolve ve scoretype va milestonepoints de dung voi mo hinh series hien co.':
        'Preview: series preset hiện tại resolve về scoreType và milestonePoints để dùng với mô hình series hiện có.',
    'preview series preset hien tai resolve ve scoretype va milestonepoints de dung voi mo hinh series hien co':
        'Preview: series preset hiện tại resolve về scoreType và milestonePoints để dùng với mô hình series hiện có.',
    'chuoi su kien cong diem theo moc so su kien hoan thanh, khong cong diem tung su kien le.':
        'Chuỗi sự kiện cộng điểm theo mốc số sự kiện hoàn thành, không cộng điểm từng sự kiện lẻ.',
    'chuoi su kien cong diem theo moc so su kien hoan thanh, khong cong diem tung su kien le':
        'Chuỗi sự kiện cộng điểm theo mốc số sự kiện hoàn thành, không cộng điểm từng sự kiện lẻ.',
    'cau hinh milestonepoints theo so su kien da hoan thanh trong chuoi.':
        'Cấu hình milestonePoints theo số sự kiện đã hoàn thành trong chuỗi.',
    'cau hinh milestonepoints theo so su kien da hoan thanh trong chuoi':
        'Cấu hình milestonePoints theo số sự kiện đã hoàn thành trong chuỗi.',
    'co the bat yeu cau toi thieu va phat diem neu khong dat so su kien toi thieu.':
        'Có thể bật yêu cầu tối thiểu và phạt điểm nếu không đạt số sự kiện tối thiểu.',
    'co the bat yeu cau toi thieu va phat diem neu khong dat so su kien toi thieu':
        'Có thể bật yêu cầu tối thiểu và phạt điểm nếu không đạt số sự kiện tối thiểu.',

    // Rule labels / descriptions từ BE series preset (không dấu / lẫn dấu)
    'diem moc tich luy (milestones)': 'Điểm mốc tích lũy (milestones)',
    'diem moc tich luy': 'Điểm mốc tích lũy',
    'cong diem thuong khi sinh vien dat cac moc so luong su kien con da hoan thanh.':
        'Cộng điểm thưởng khi sinh viên đạt các mốc số lượng sự kiện con đã hoàn thành.',
    'cong diem thuong khi sinh vien dat cac moc so luong su kien con da hoan thanh':
        'Cộng điểm thưởng khi sinh viên đạt các mốc số lượng sự kiện con đã hoàn thành.',
    'yeu cau toi thieu': 'Yêu cầu tối thiểu',
    'phat diem neu dang ky tham gia chuoi nhung khong dat so su kien toi thieu.':
        'Phạt điểm nếu đăng ký tham gia chuỗi nhưng không đạt số sự kiện tối thiểu.',
    'phat diem neu dang ky tham gia chuoi nhung khong dat so su kien toi thieu':
        'Phạt điểm nếu đăng ký tham gia chuỗi nhưng không đạt số sự kiện tối thiểu.',
    'gioi han doi tuong nhan diem': 'Giới hạn đối tượng nhận điểm',
    'kiem soat viec student thuoc khoa nao se duoc cong/tru diem tu chuoi nay.':
        'Kiểm soát việc sinh viên thuộc khoa nào sẽ được cộng/trừ điểm từ chuỗi này.',
    'kiem soat viec student thuoc khoa nao se duoc cong/tru diem tu chuoi nay':
        'Kiểm soát việc sinh viên thuộc khoa nào sẽ được cộng/trừ điểm từ chuỗi này.',
    'kiem soat viec sinh vien thuoc khoa nao se duoc cong/tru diem tu chuoi nay.':
        'Kiểm soát việc sinh viên thuộc khoa nào sẽ được cộng/trừ điểm từ chuỗi này.',
    'kiem soat viec sinh vien thuoc khoa nao se duoc cong/tru diem tu chuoi nay':
        'Kiểm soát việc sinh viên thuộc khoa nào sẽ được cộng/trừ điểm từ chuỗi này.',
    'nhap so buoi': 'Nhập số buổi',
    'nhap diem': 'Nhập điểm',
    'moc diem theo so su kien': 'Mốc điểm theo số sự kiện',
    'bat yeu cau toi thieu': 'Bật yêu cầu tối thiểu',
    'so su kien toi thieu': 'Số sự kiện tối thiểu',
    'diem phat khi khong dat toi thieu': 'Điểm phạt khi không đạt tối thiểu',
    'danh sach khoa': 'Danh sách khoa',
    'doi tuong nhan diem': 'Đối tượng nhận điểm',

    // —— ENTERPRISE_SERIES ——
    'chuoi chuyen de doanh nghiep tich luy theo so buoi hoan thanh.':
        'Chuỗi chuyên đề doanh nghiệp tích lũy theo số buổi hoàn thành.',
    'chuoi chuyen de doanh nghiep tich luy theo so buoi hoan thanh':
        'Chuỗi chuyên đề doanh nghiệp tích lũy theo số buổi hoàn thành.',
    'mac dinh scoretype la diem chuyen de.':
        'Mặc định scoreType là Điểm chuyên đề.',
    'mac dinh scoretype la diem chuyen de':
        'Mặc định scoreType là Điểm chuyên đề.',
    'moc diem mac dinh tang dan theo so buoi da tham gia.':
        'Mốc điểm mặc định tăng dần theo số buổi đã tham gia.',
    'moc diem mac dinh tang dan theo so buoi da tham gia':
        'Mốc điểm mặc định tăng dần theo số buổi đã tham gia.',
    'chuoi chuyen de doanh nghiep tinh diem chuyen de theo moc so su kien.':
        'Chuỗi chuyên đề doanh nghiệp tính điểm chuyên đề theo mốc số sự kiện.',
    'chuoi chuyen de doanh nghiep tinh diem chuyen de theo moc so su kien':
        'Chuỗi chuyên đề doanh nghiệp tính điểm chuyên đề theo mốc số sự kiện.',
    'su kien con trong chuoi khong ghi diem rieng le.':
        'Sự kiện con trong chuỗi không ghi điểm riêng lẻ.',
    'su kien con trong chuoi khong ghi diem rieng le':
        'Sự kiện con trong chuỗi không ghi điểm riêng lẻ.',

    // —— CUSTOM ——
    'tuy chinh day du cac rule, admin tu chon rule va tham so.':
        'Tùy chỉnh đầy đủ các rule, admin tự chọn rule và tham số.',
    'tuy chinh day du cac rule, admin tu chon rule va tham so':
        'Tùy chỉnh đầy đủ các rule, admin tự chọn rule và tham số.',
    'khong dung mau co san, cau hinh thu cong tung luat diem.':
        'Không dùng mẫu có sẵn, cấu hình thủ công từng luật điểm.',
    'khong dung mau co san, cau hinh thu cong tung luat diem':
        'Không dùng mẫu có sẵn, cấu hình thủ công từng luật điểm.',

    // —— Notes bổ sung (preset / rule) ——
    'penalty qua han chua nop duoc map qua trigger qua han nhiem vu.':
        'Penalty quá hạn chưa nộp được map qua trigger Quá hạn nhiệm vụ.',
    'penalty qua han chua nop duoc map qua trigger qua han nhiem vu':
        'Penalty quá hạn chưa nộp được map qua trigger Quá hạn nhiệm vụ.',
    'preset nay mac dinh tat vang mat (khong tham gia); neu bat, nen cau hinh ro score type va penalty points.':
        'Preset này mặc định tắt Vắng mặt (không tham gia); nếu bật, nên cấu hình rõ score type và penalty points.',
    'preset nay mac dinh tat vang mat (khong tham gia); neu bat, nen cau hinh ro score type va penalty points':
        'Preset này mặc định tắt Vắng mặt (không tham gia); nếu bật, nên cấu hình rõ score type và penalty points.',
    'diem diem chuyen de co the duoc cau hinh nhu diem tich luy so buoi thong qua rule tham gia hoan thanh.':
        'Điểm chuyên đề có thể được cấu hình như điểm tích lũy số buổi thông qua rule Tham gia hoàn thành.',
    'diem diem chuyen de co the duoc cau hinh nhu diem tich luy so buoi thong qua rule tham gia hoan thanh':
        'Điểm chuyên đề có thể được cấu hình như điểm tích lũy số buổi thông qua rule Tham gia hoàn thành.',
    'neu bat nop bai va duoc cham (cham bai thu hoach), rule hoan thanh tham gia se tu tat de tranh cong diem trung check-in/check-out.':
        'Nếu bật Nộp bài và được chấm (chấm bài thu hoạch), rule Hoàn thành tham gia sẽ tự tắt để tránh cộng điểm trùng check-in/check-out.',
    'neu bat nop bai va duoc cham (cham bai thu hoach), rule hoan thanh tham gia se tu tat de tranh cong diem trung check-in/check-out':
        'Nếu bật Nộp bài và được chấm (chấm bài thu hoạch), rule Hoàn thành tham gia sẽ tự tắt để tránh cộng điểm trùng check-in/check-out.',

    // Presets names
    'su kien co ban': 'Sự kiện cơ bản',
    'su kien co nop bai': 'Sự kiện có nộp bài',
    'chuyen de doanh nghiep co ban': 'Chuyên đề doanh nghiệp cơ bản',
    'chuyen de doanh nghiep (co thuong)': 'Chuyên đề doanh nghiệp (có thưởng)',
    'chuyen de doanh nghiep co thuong': 'Chuyên đề doanh nghiệp (có thưởng)',
    'minigame (chi tinh dat)': 'Minigame (chỉ tính đạt)',
    'minigame chi tinh dat': 'Minigame (chỉ tính đạt)',
    'chuoi su kien co ban': 'Chuỗi sự kiện cơ bản',
    'chuoi chuyen de doanh nghiep': 'Chuỗi chuyên đề doanh nghiệp',
    'tuy chinh': 'Tùy chỉnh',
    'tuy chinh (khong dung mau)': 'Tùy chỉnh (không dùng mẫu)',
    'khong dung mau': 'Không dùng mẫu',

    // Rules / triggers
    'hoan thanh tham gia': 'Hoàn thành tham gia',
    'tham gia hoan thanh': 'Tham gia hoàn thành',
    'tham gia hoan tat': 'Tham gia hoàn tất',
    'tham gia': 'Tham gia',
    'vang mat (khong tham gia)': 'Vắng mặt (không tham gia)',
    'vang mat': 'Vắng mặt',
    'khong tham gia (vang)': 'Không tham gia (vắng)',
    'khong tham gia': 'Không tham gia',
    'nop bai va duoc cham': 'Nộp bài và được chấm',
    'nop bai duoc cham': 'Nộp bài được chấm',
    'duoc cham bai': 'Được chấm bài',
    'cham diem bai thu hoach': 'Chấm điểm bài thu hoạch',
    'dat minigame': 'Đạt minigame',
    'vuot qua minigame': 'Vượt qua minigame',
    'het luot minigame': 'Hết lượt minigame',
    'qua han nhiem vu': 'Quá hạn nhiệm vụ',
    'dat moc chuoi su kien': 'Đạt mốc chuỗi sự kiện',
    'dat moc chuoi': 'Đạt mốc chuỗi',

    // Score types
    'diem ren luyen': 'Điểm rèn luyện',
    'ren luyen': 'Rèn luyện',
    'diem cong tac xa hoi': 'Điểm công tác xã hội',
    'cong tac xa hoi': 'Công tác xã hội',
    'diem ctxh': 'Điểm CTXH',
    'ctxh': 'CTXH',
    'diem chuyen de': 'Điểm chuyên đề',
    'chuyen de': 'Chuyên đề',

    // Preview / common UI fragments
    'diem tham gia': 'Điểm tham gia',
    'diem phat vang mat': 'Điểm phạt vắng mặt',
    'diem khi dat': 'Điểm khi đạt',
    'diem khi khong dat': 'Điểm khi không đạt',
    'diem thuong': 'Điểm thưởng',
    'diem phat qua han': 'Điểm phạt quá hạn',
    'loai diem chinh': 'Loại điểm chính',
    'loai diem': 'Loại điểm',
    'score type chinh': 'score type chính',
    'doi tuong ap dung': 'Đối tượng áp dụng',
    'doi tuong': 'Đối tượng',
    'tat ca nguoi tham gia': 'Tất cả người tham gia',
    'tat ca': 'Tất cả',
    'chi sinh vien khoa/nganh': 'Chỉ sinh viên khoa / ngành',
    'sinh vien ngoai khoa': 'Sinh viên ngoài khoa',
    'hoc ky cua hoat dong': 'Học kỳ của hoạt động',
    'theo su kien': 'Theo sự kiện',
    'chi dinh hoc ky': 'Chỉ định học kỳ',
    'bat buoc': 'Bắt buộc',
    'tuy chon': 'Tùy chọn',
    'khong dat': 'Không đạt',
    'dat': 'Đạt',
    'phat': 'Phạt',
    'thuong': 'Thưởng',

    // Mô tả / notes — cụm hay gặp (ghép câu lẫn dấu)
    'su kien check-in/check-out': 'Sự kiện check-in/check-out',
    'su kien': 'Sự kiện',
    'va chot ket qua': 'và chốt kết quả',
    'chot ket qua': 'chốt kết quả',
    'de cong diem': 'để cộng điểm',
    'cong diem hoac tru diem': 'cộng điểm hoặc trừ điểm',
    'cong diem': 'cộng điểm',
    'hoac tru diem': 'hoặc trừ điểm',
    'tru diem': 'trừ điểm',
    'khi danh gia': 'khi đánh giá',
    'danh gia': 'đánh giá',
    'mac dinh sinh rule': 'Mặc định sinh rule',
    'mac dinh bat': 'Mặc định bật',
    'mac dinh': 'mặc định',
    'bat vang mat': 'bật Vắng mặt',
    'va tru cung': 'và trừ cùng',
    'co the dung': 'Có thể dùng',
    'co the tat bang': 'có thể tắt bằng',
    'co the': 'có thể',
    'de tru diem': 'để trừ điểm',
    'preset chi sinh': 'Preset chỉ sinh',
    'preset nay': 'Preset này',
    'thao tac nhanh hon': 'thao tác nhanh hơn',
    'van co the': 'vẫn có thể',
    'chuyen sang': 'chuyển sang',
    'khi can': 'khi cần',
    'failpoints': 'failPoints',
    'scorerules': 'scoreRules',
    'noshowpenaltyenabled': 'noShowPenaltyEnabled',
    'fe/be': 'FE/BE',
    'cong diem khi sinh vien hoan thanh tham gia su kien':
        'Cộng điểm khi sinh viên hoàn thành tham gia sự kiện',
    'cong diem khi hoan thanh tham gia': 'Cộng điểm khi hoàn thành tham gia',
    'tru diem khi da dang ky nhung khong den tham gia':
        'Trừ điểm khi đã đăng ký nhưng không đến tham gia',
    'tru diem khi vang mat': 'Trừ điểm khi vắng mặt',
    'yeu cau nop bai thu hoach': 'Yêu cầu nộp bài thu hoạch',
    'cong diem khi dat minigame': 'Cộng điểm khi đạt minigame',
    'cong diem khi nop bai dat': 'Cộng điểm khi nộp bài đạt',
    'tru diem khi nop bai khong dat': 'Trừ điểm khi nộp bài không đạt',
    'tru diem khi qua han': 'Trừ điểm khi quá hạn',
    'ap dung cho tat ca nguoi tham gia': 'Áp dụng cho tất cả người tham gia',
    'theo hoc ky cua hoat dong': 'Theo học kỳ của hoạt động',
    'sinh vien khoa/nganh noi bo': 'Sinh viên khoa/ngành nội bộ',
    'sinh vien ngoai khoa/nganh': 'Sinh viên ngoài khoa/ngành',

    // Từ / cụm thường gặp trong mô tả preset
    'yeu cau': 'yêu cầu',
    'yeu cau nop bai': 'yêu cầu nộp bài',
    'nop bai': 'nộp bài',
    'chua nop': 'chưa nộp',
    'cham bai': 'chấm bài',
    'cham pass/fail': 'chấm pass/fail',
    'pass/fail': 'pass/fail',
    'cau hinh rieng': 'cấu hình riêng',
    'lien quan': 'liên quan',
    'them rule': 'thêm rule',
    'assignment': 'assignment',
    'tich luy': 'tích lũy',
    'buoi': 'buổi',
    'moi lan': 'mỗi lần',
    'cong 1 diem': 'cộng 1 điểm',
    'tat': 'tắt',
    'tranh tru nguoc': 'tránh trừ ngược',
    'tren cung rule': 'trên cùng rule',
    'vua': 'vừa',
    'cong them': 'cộng thêm',
    'khac nhu': 'khác như',
    'sinh 2 rule': 'sinh 2 rule',
    'so buoi': 'Số buổi',
    'penalty no-show': 'penalty no-show',
    'neu can': 'nếu cần',
    'neu bat': 'nếu bật',
    'nen tru': 'nên trừ',
    'tru sang': 'trừ sang',
    'score type khac': 'score type khác',
    'dung khi': 'dùng khi',
    'rieng le': 'riêng lẻ',
    'su kien le': 'sự kiện lẻ',
    'su kien con': 'sự kiện con',
    'trong chuoi': 'trong chuỗi',
    'theo moc': 'theo mốc',
    'milestonepoints': 'milestonePoints',
    'scoretype': 'scoreType',
    'dinh nghia cac moc hoan thanh': 'Định nghĩa các mốc hoàn thành',
    'diem thuong tuong ung': 'điểm thưởng tương ứng',
    'phu hop cho chuoi su kien': 'Phù hợp cho chuỗi sự kiện',
    'thong thuong can moc': 'thông thường cần mốc',
    'series preset hien tai resolve': 'Series preset hiện tại resolve',
    'mo hinh series hien co': 'mô hình series hiện có',
    'tich luy theo so buoi hoan thanh': 'tích lũy theo số buổi hoàn thành',
    'moc diem mac dinh tang dan': 'Mốc điểm mặc định tăng dần',
    'so buoi da tham gia': 'số buổi đã tham gia',
    'mac dinh scoretype la': 'Mặc định scoreType là',
    'toi thieu': 'tối thiểu',
    'thu cong': 'thủ công',
    'tung luat diem': 'từng luật điểm',
    'co san': 'có sẵn',
    'day du': 'đầy đủ',
    'tu chon': 'tự chọn',
    'tham so': 'tham số',
    'het luot': 'hết lượt',
    'ma chua dat': 'mà chưa đạt',
    'phat vang mat': 'phạt vắng mặt',
    'chi cong diem': 'chỉ cộng điểm',
    'hoac vang mat': 'hoặc vắng mặt',
    'ghi diem rieng': 'ghi điểm riêng',
    'da hoan thanh': 'đã hoàn thành',
    'diem tich luy': 'điểm tích lũy',
    'tru nguoc': 'trừ ngược',
    'vao diem': 'vào điểm',
    'cho moi lan': 'cho mỗi lần',
    '1 rule': '1 rule',
    '2 rule': '2 rule',
    'rule bonus': 'rule bonus',
    'va 1 rule': 'và 1 rule',
    'penalty qua han chua nop': 'penalty quá hạn chưa nộp',
    'duoc map qua trigger': 'được map qua trigger',
    'cau hinh ro': 'cấu hình rõ',
    'penalty points': 'penalty points',
    'duoc cau hinh': 'được cấu hình',
    'diem tich luy so buoi': 'điểm tích lũy số buổi',
    'thong qua rule': 'thông qua rule',
    'cham bai thu hoach': 'chấm bài thu hoạch',
    'se tu tat': 'sẽ tự tắt',
    'tranh cong diem trung': 'tránh cộng điểm trùng',
    'nen cau hinh': 'nên cấu hình',
    'map qua trigger': 'map qua trigger',
    'nhu diem': 'như điểm',
    'co the duoc': 'có thể được',
    'khong the huy vi ban da tham gia su kien': 'Không thể huỷ vì bạn đã tham gia sự kiện',
    'khong the huy vi ban da tham gia su kien.': 'Không thể huỷ vì bạn đã tham gia sự kiện.',
};

const PHRASE_KEYS_BY_LENGTH = Object.keys(PHRASE_LABELS).sort((a, b) => b.length - a.length);

/** Chỉ khớp cụm tại ranh giới từ (tránh "va" trong "vang", "co" trong "completion"). */
function canMatchPhraseAt(haystack: string, index: number, phrase: string): boolean {
    if (!haystack.startsWith(phrase, index)) return false;
    if (index > 0) {
        const prev = haystack[index - 1];
        const first = phrase[0];
        if (/[a-z0-9]/.test(prev) && /[a-z0-9]/.test(first)) return false;
    }
    const end = index + phrase.length;
    if (end < haystack.length) {
        const next = haystack[end];
        const last = phrase[phrase.length - 1];
        if (/[a-z0-9]/.test(last) && /[a-z0-9]/.test(next)) return false;
    }
    return true;
}

/** Thay cụm không dấu → có dấu (ưu tiên cụm dài). */
function rebuildWithPhrases(stripped: string): { text: string; matched: boolean } {
    let rebuilt = '';
    let cursor = 0;
    let matched = false;
    while (cursor < stripped.length) {
        let found = false;
        for (const phrase of PHRASE_KEYS_BY_LENGTH) {
            if (canMatchPhraseAt(stripped, cursor, phrase)) {
                rebuilt += PHRASE_LABELS[phrase];
                cursor += phrase.length;
                found = true;
                matched = true;
                break;
            }
        }
        if (!found) {
            rebuilt += stripped[cursor];
            cursor += 1;
        }
    }
    return { text: rebuilt, matched };
}

export function getCodeLabel(code?: string | null, fallback?: string): string {
    if (!code) return localizeVi(fallback) || '';
    return CODE_LABELS[code] ?? localizeVi(fallback) ?? localizeVi(code) ?? code;
}

export function getPresetDisplayName(code?: string | null, fallback?: string | null): string {
    if (!code) return localizeVi(fallback) || 'Không có';
    return PRESET_DISPLAY_NAMES[code] ?? localizeVi(fallback) ?? code;
}

/** Mô tả preset — localize chuỗi từ BE (có thể lẫn dấu / không dấu). */
export function getPresetDescription(code?: string | null, fallback?: string | null): string {
    return localizeVi(fallback) || (code ? localizeVi(PRESET_DISPLAY_NAMES[code]) : '') || '';
}

/** Notes preset — localize từng dòng. */
export function getPresetNotes(notes?: string[] | null): string[] {
    return localizeNotes(notes);
}

export function getRuleLabel(ruleKey: string, fallback?: string | null): string {
    if (RULE_LABELS[ruleKey]?.label) return RULE_LABELS[ruleKey].label;
    return localizeVi(fallback) || getCodeLabel(ruleKey, fallback || ruleKey) || ruleKey;
}

export function getRuleDescription(ruleKey: string, fallback?: string | null): string {
    if (RULE_LABELS[ruleKey]?.description) return RULE_LABELS[ruleKey].description;
    const localized = localizeVi(fallback);
    // Nếu localize chỉ trả về chuỗi gốc (không khớp), vẫn trả localized đã rebuild nếu có
    return localized || fallback || '';
}

export function getFieldLabel(fieldName: string, fallback?: string | null): string {
    return FIELD_LABELS[fieldName] ?? localizeVi(fallback) ?? fieldName;
}

/** Dịch nhãn tùy chọn SELECT (enum hoặc chuỗi không dấu). */
export function getOptionLabel(value: string | number, fallback?: string | null): string {
    const raw = String(value);
    return getCodeLabel(raw) || localizeVi(fallback ?? raw) || raw;
}

/**
 * Chuẩn hóa chuỗi hiển thị từ BE (có thể không dấu / lẫn dấu) thành tiếng Việt có dấu.
 */
export function localizeVi(text?: string | null): string {
    if (text == null) return '';
    const trimmed = String(text).trim();
    if (!trimmed) return '';

    if (CODE_LABELS[trimmed]) return CODE_LABELS[trimmed];
    if (PRESET_DISPLAY_NAMES[trimmed]) return PRESET_DISPLAY_NAMES[trimmed];

    const key = stripDiacritics(trimmed);
    if (PHRASE_LABELS[key]) return PHRASE_LABELS[key];

    // Thay mã enum trong câu (vd: "REN_LUYEN khi PASS")
    let withCodes = trimmed;
    for (const [code, label] of Object.entries(CODE_LABELS)) {
        if (withCodes.includes(code)) {
            withCodes = withCodes.split(code).join(label);
        }
    }

    // Luôn rebuild theo cụm (kể cả câu đã lẫn vài chỗ có dấu từ BE)
    const { text: rebuilt, matched } = rebuildWithPhrases(stripDiacritics(withCodes));
    if (matched) return rebuilt;

    return withCodes !== trimmed ? withCodes : trimmed;
}

export function localizeNotes(notes?: string[] | null): string[] {
    if (!notes?.length) return [];
    return notes.map((n) => localizeVi(n));
}

export function getActivityTypeLabel(type?: string | null): string {
    if (!type) return '';
    const map: Record<string, string> = {
        SUKIEN: 'Sự kiện',
        MINIGAME: 'Minigame',
        CONG_TAC_XA_HOI: 'Công tác xã hội',
        CHUYEN_DE_DOANH_NGHIEP: 'Chuyên đề doanh nghiệp',
    };
    return map[type] ?? localizeVi(type) ?? type;
}

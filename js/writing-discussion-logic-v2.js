// ================================================
// Writing - 토론형 어댑터 (v=20250212-001)
// ================================================
// Module 책임: 화면 전환, 진행률, 버튼 제어, 자동 이동, cleanup

// ============================================
// 전역 컴포넌트 인스턴스
// ============================================
let currentDiscussionComponent = null;

// ============================================
// 모듈 시스템용 초기화
// ============================================
async function initDiscussionComponent(setId, onCompleteCallback) {
    console.log(`📦 [모듈] initDiscussionComponent - setId: ${setId}`);
    currentDiscussionComponent = new DiscussionComponent();
    window.currentDiscussionComponent = currentDiscussionComponent;
    
    // 완료 콜백 설정
    const originalOnComplete = currentDiscussionComponent.onSubmitComplete;
    currentDiscussionComponent.onSubmitComplete = function(results) {
        console.log(`✅ [모듈] Discussion Component 완료`);
        if (onCompleteCallback) onCompleteCallback(results);
        if (originalOnComplete) originalOnComplete.call(this, results);
    };
    
    await currentDiscussionComponent.init(setId);
}

// ============================================
// 초기화
// ============================================
async function initWritingDiscussion() {
    console.log('📝 [Discussion] 초기화 시작...');
    
    // 컴포넌트 생성
    currentDiscussionComponent = new DiscussionComponent();
    window.currentDiscussionComponent = currentDiscussionComponent;
    
    // 데이터 로드
    await currentDiscussionComponent.loadDiscussionData();
    
    // 화면 전환 (Module 책임)
    showScreen('writingDiscussionScreen');
    
    // 진행률 표시 (Module 책임)
    updateProgress('Writing', 'Discussion', 0, 1);
    
    // 문제 로드
    currentDiscussionComponent.loadDiscussionQuestion(0);
    
    // 타이머 시작 (Component가 관리, Module은 콜백 제공)
    currentDiscussionComponent.startDiscussionTimer(
        // onTimeUpdate 콜백
        (remainingTime) => {
            const timerElement = document.getElementById('discussionTimer');
            if (timerElement) {
                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                timerElement.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
            }
        },
        // onTimeEnd 콜백
        () => {
            console.log('⏰ [Discussion] 시간 종료 → 자동 제출');
            submitWritingDiscussion();
        }
    );
    
    // Submit 버튼 표시 (Module 책임)
    updateDiscussionButtons();
    
    console.log('✅ [Discussion] 초기화 완료');
}

// ============================================
// 버튼 제어 (Module 책임)
// ============================================
function updateDiscussionButtons() {
    const nextBtn = document.getElementById('nextDiscussionBtn');
    const submitBtn = document.getElementById('submitDiscussionBtn');
    
    if (nextBtn) nextBtn.style.display = 'none';
    if (submitBtn) {
        submitBtn.style.display = 'inline-block';
        submitBtn.disabled = false;
    }
}

// ============================================
// 제출 (Module 책임: 화면 전환)
// ============================================
function submitWritingDiscussion() {
    console.log('📤 [Discussion Module] 제출 시작...');
    
    if (!currentDiscussionComponent) {
        console.error('❌ 컴포넌트가 초기화되지 않았습니다.');
        return;
    }
    
    // 컴포넌트 제출 실행
    const resultData = currentDiscussionComponent.submit();
    
    // 화면 전환 (Module 책임)
    showScreen('writingDiscussionResultScreen');
    
    // 결과 화면 표시 (Component 책임)
    currentDiscussionComponent.showDiscussionResult(resultData);
    
    console.log('✅ [Discussion Module] 제출 완료');
}

// ============================================
// 어댑터 함수 (기존 코드 호환)
// ============================================

/**
 * 잘라내기 어댑터
 */
function cutDiscussion() {
    if (currentDiscussionComponent) {
        currentDiscussionComponent.cutDiscussion();
    }
}

/**
 * 붙여넣기 어댑터
 */
function pasteDiscussion() {
    if (currentDiscussionComponent) {
        currentDiscussionComponent.pasteDiscussion();
    }
}

/**
 * Undo 어댑터
 */
function undoDiscussion() {
    if (currentDiscussionComponent) {
        currentDiscussionComponent.undoDiscussion();
    }
}

/**
 * Redo 어댑터
 */
function redoDiscussion() {
    if (currentDiscussionComponent) {
        currentDiscussionComponent.redoDiscussion();
    }
}

/**
 * 단어 수 토글 어댑터
 */
function toggleDiscussionWordCount() {
    if (currentDiscussionComponent) {
        currentDiscussionComponent.toggleDiscussionWordCount();
    }
}

/**
 * 다운로드 어댑터
 */
function downloadDiscussion() {
    if (currentDiscussionComponent) {
        const setData = currentDiscussionComponent.writingDiscussionData[currentDiscussionComponent.currentDiscussionSet];
        const userAnswer = currentDiscussionComponent.discussionAnswers[currentDiscussionComponent.currentDiscussionSet] || '';
        const wordCount = userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0;
        
        currentDiscussionComponent.downloadDiscussion(setData, userAnswer, wordCount);
    }
}

window.initDiscussionComponent = initDiscussionComponent;
window.initWritingDiscussion = initWritingDiscussion;

/**
 * 문제 토글 어댑터
 */
function toggleDiscussionProblem() {
    if (currentDiscussionComponent) {
        currentDiscussionComponent.toggleDiscussionProblem();
    }
}

// ============================================
// Cleanup (Module 책임)
// ============================================
function cleanupDiscussion() {
    console.log('🧹 [Discussion] Cleanup...');
    
    if (currentDiscussionComponent) {
        currentDiscussionComponent.stopDiscussionTimer();
        currentDiscussionComponent = null;
        window.currentDiscussionComponent = null;
    }
}

console.log('✅ Writing-Discussion 어댑터 로드 완료 (v=20250212-001)');

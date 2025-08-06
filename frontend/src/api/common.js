// 공통 fetch 함수
export async function fetchWithErrorHandling(url, options = {}) {
  try {
    console.log(`API 요청: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      console.log('요청 데이터:', options.body);
    }

    const response = await fetch(url, options);
    console.log(`응답 상태: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP 오류 ${response.status}: ${response.statusText}`
      }));
      console.error('응답 오류 데이터:', errorData);
      const error = new Error(errorData.error || `HTTP 오류 ${response.status}`);
      error.response = errorData;
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    console.log('응답 데이터:', data);
    return data;
  } catch (error) {
    console.error('API 요청 실패:', error);
    throw error;
  }
}

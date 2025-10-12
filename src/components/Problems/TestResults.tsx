// import type { ProblemTestCase } from "./types";

interface TestResult {
  testId: string;
  passed: boolean;
  input: unknown[];
  expected: unknown;
  actual: unknown;
  error?: string;
}

interface Props {
  results: TestResult[];
  allPassed: boolean;
  error?: string;
  onRunSingle?: (testId: string) => void;
}

export default function TestResults({ results, allPassed, error, onRunSingle }: Props) {
  if (error) {
    return (
      <div style={{ padding: 12 }}>
        <div style={{ color: '#f85149', fontWeight: 'bold', marginBottom: 12, fontSize: 16 }}>
          ❌ Ошибка выполнения
        </div>
        <pre style={{ 
          background: 'var(--control-bg)', 
          padding: 12, 
          borderRadius: 6, 
          fontSize: 13,
          whiteSpace: 'pre-wrap',
          color: '#f85149',
          border: '1px solid #f85149',
          margin: 0,
          lineHeight: 1.4
        }}>
          {error}
        </pre>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div style={{ 
        padding: 20, 
        textAlign: 'center',
        opacity: 0.6, 
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 200
      }}>
        <div>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🧪</div>
          <div>Запустите тесты, чтобы увидеть результаты</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ 
        color: allPassed ? '#3fb950' : '#f85149', 
        fontWeight: 'bold', 
        marginBottom: 12,
        fontSize: 16
      }}>
        {allPassed ? '✅ Все тесты пройдены!' : '❌ Некоторые тесты не прошли'}
      </div>
      
      <div style={{ fontSize: 12, marginBottom: 8, opacity: 0.8 }}>
        Пройдено: {results.filter(r => r.passed).length} / {results.length}
      </div>

      {results.map((result, index) => (
        <div 
          key={result.testId}
          style={{ 
            border: `1px solid ${result.passed ? '#3fb950' : '#f85149'}`,
            borderRadius: 6,
            padding: 8,
            marginBottom: 8,
            background: result.passed ? 'rgba(63, 185, 80, 0.1)' : 'rgba(248, 81, 73, 0.1)'
          }}
        >
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: 4,
            color: result.passed ? '#3fb950' : '#f85149'
          }}>
            {result.passed ? '✅' : '❌'} Тест {result.testId} (#{index + 1}) //Костыль
          </div>
          
          <div style={{ fontSize: 12 }}>
            <div><strong>Вход:</strong> {JSON.stringify(result.input)}</div>
            <div><strong>Ожидается:</strong> {JSON.stringify(result.expected)}</div>
            <div><strong>Получено:</strong> 
              <span style={{ color: result.passed ? '#3fb950' : '#f85149' }}>
                {JSON.stringify(result.actual)}
              </span>
            </div>
            {onRunSingle && (
              <div style={{ marginTop: 6 }}>
                <button className="control" style={{ width: 160 }} onClick={() => onRunSingle(result.testId)}>Запустить только этот</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

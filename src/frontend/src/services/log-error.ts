import { isAxiosError } from 'axios';

function traduzirStatus(status?: number) {
  switch (status) {
    case 400:
      return 'Requisicao invalida.';
    case 401:
      return 'Sua sessao expirou. Entre novamente.';
    case 403:
      return 'Voce nao tem permissao para realizar esta acao.';
    case 404:
      return 'Nao foi possivel encontrar o recurso solicitado.';
    case 408:
      return 'A requisicao demorou mais do que o esperado.';
    case 409:
      return 'Conflito ao processar a requisicao.';
    case 422:
      return 'Os dados enviados sao invalidos.';
    case 429:
      return 'Muitas tentativas seguidas. Tente novamente em instantes.';
    case 500:
      return 'O servidor encontrou um erro interno.';
    case 502:
    case 503:
    case 504:
      return 'O servico esta indisponivel no momento.';
    default:
      return null;
  }
}

function traduzirMensagemTecnica(message: string) {
  const normalized = message.trim();

  if (!normalized) {
    return 'Nao foi possivel concluir a acao.';
  }

  if (normalized === 'Network Error') {
    return 'Nao foi possivel se conectar com o servidor.';
  }

  if (normalized.startsWith('timeout of')) {
    return 'A requisicao excedeu o tempo limite.';
  }

  if (normalized.startsWith('Request failed with status code')) {
    const status = Number(normalized.replace('Request failed with status code', '').trim());
    return traduzirStatus(Number.isNaN(status) ? undefined : status) ?? 'A requisicao falhou.';
  }

  if (normalized === 'canceled') {
    return 'A requisicao foi cancelada.';
  }

  return normalized;
}

export function formatErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const apiMessage = error.response?.data?.message;

    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }

    if (Array.isArray(apiMessage) && apiMessage.length > 0) {
      return apiMessage.join('\n');
    }

    return traduzirStatus(error.response?.status) ?? traduzirMensagemTecnica(error.message);
  }

  if (error instanceof Error) {
    return traduzirMensagemTecnica(error.message);
  }

  return 'Nao foi possivel concluir a acao.';
}

export function logError(context: string, error: unknown) {
  if (isAxiosError(error)) {
    console.error(`[${context}] Erro de requisicao`, {
      mensagem: formatErrorMessage(error),
      metodo: error.config?.method,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      dadosEnviados: error.config?.data,
      dadosRecebidos: error.response?.data,
      parametros: error.config?.params,
    });
    return;
  }

  if (error instanceof Error) {
    console.error(`[${context}] Erro`, {
      nome: error.name,
      mensagem: formatErrorMessage(error),
      stack: error.stack,
    });
    return;
  }

  console.error(`[${context}] Erro desconhecido`, error);
}

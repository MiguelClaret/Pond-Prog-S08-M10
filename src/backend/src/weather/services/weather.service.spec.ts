import { WeatherService } from './weather.service';

describe('WeatherService', () => {
  const originalFetch = global.fetch;
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = new WeatherService();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('should map weather response from Open-Meteo', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 22.5,
          relative_humidity_2m: 70,
          weather_code: 2,
        },
      }),
    }) as typeof fetch;

    const result = await weatherService.getCurrentWeather(-23.55, -46.63);

    expect(result).toEqual({
      temperature: 22.5,
      humidity: 70,
      weatherCode: 2,
      description: 'Parcialmente nublado',
    });
  });

  it('should return null weather fields when api fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as typeof fetch;

    const result = await weatherService.getCurrentWeather(-23.55, -46.63);

    expect(result).toEqual({
      temperature: null,
      humidity: null,
      weatherCode: null,
      description: null,
    });
  });
});

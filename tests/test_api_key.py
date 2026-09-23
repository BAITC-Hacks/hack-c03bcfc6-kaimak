"""API key isolation and validation; no external API requests."""
import io
import json
import os
import unittest
from unittest.mock import patch

import ai
from server import Handler


class ApiKeyTests(unittest.TestCase):
    def request(self, body, route='/api/analyze'):
        handler = object.__new__(Handler)
        raw = json.dumps(body).encode()
        handler.path = route
        handler.headers = {'Content-Length': str(len(raw))}
        handler.rfile = io.BytesIO(raw)
        with patch.object(handler, '_json') as respond, patch('server.simulate', return_value={}), patch('server.validate_choices', return_value=[]), patch('server.analyze_with_providers', return_value={}) as analyze:
            handler.do_POST()
        return respond.call_args.args, analyze

    def test_key_forwarded_without_echo(self):
        response, analyze = self.request({'choices': [], 'lang': 'en', 'openai_api_key': 'sk-user-secret'})
        self.assertEqual(response[0], 200)
        self.assertEqual(analyze.call_args.kwargs, {'openai_key': 'sk-user-secret'})
        self.assertNotIn('sk-user-secret', json.dumps(response))

    def test_invalid_keys_rejected_without_echo(self):
        for key in ['sk-secret\nInjected: header', '', 123, [], 'sk-' + 'a' * 512]:
            with self.subTest(key_type=type(key).__name__):
                response, analyze = self.request({'choices': [], 'openai_api_key': key})
                self.assertEqual(response[0], 400)
                analyze.assert_not_called()
                self.assertNotIn('secret', json.dumps(response))

    def test_simulation_does_not_accept_credentials(self):
        response, analyze = self.request({'choices': [], 'openai_api_key': 'sk-secret'}, '/api/simulate')
        self.assertEqual(response[0], 400)
        analyze.assert_not_called()

    def test_request_key_does_not_change_server_key(self):
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'sk-server'}), patch('ai._post_json', return_value={'output': []}) as post:
            ai._openai_explanation({}, None, api_key='sk-user')
            self.assertEqual(post.call_args.args[1], 'sk-user')
            ai._openai_explanation({}, None)
            self.assertEqual(post.call_args.args[1], 'sk-server')
            self.assertEqual(os.environ['OPENAI_API_KEY'], 'sk-server')

    def test_provider_error_does_not_expose_credentials(self):
        with patch('ai._post_json', side_effect=ValueError('sk-secret')):
            result = ai._openai_explanation({}, None, api_key='sk-secret')
        self.assertEqual(result, {'status': 'api_error', 'text': None})


if __name__ == '__main__':
    unittest.main()

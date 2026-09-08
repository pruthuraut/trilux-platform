"""
Lightweight tests for the recon framework that don't require external tools.

Run with: python manage.py test recon
"""
from django.test import TestCase

from recon.tools.base import all_tools, availability_report
from recon.tools.util import normalize_severity, strip_scheme
from recon.pipeline import pipeline_steps
from recon import constants


class RegistryTests(TestCase):
    def test_all_tool_keys_registered(self):
        tools = all_tools()
        expected = [getattr(constants, k) for k in dir(constants) if k.isupper()]
        for key in expected:
            self.assertIn(key, tools, f"tool '{key}' not registered")

    def test_availability_report_is_bool_map(self):
        report = availability_report()
        self.assertTrue(all(isinstance(v, bool) for v in report.values()))

    def test_twelve_pipeline_steps_in_order(self):
        steps = pipeline_steps()
        self.assertEqual(len(steps), 12)
        self.assertEqual([s.number for s in steps], list(range(1, 13)))


class UtilTests(TestCase):
    def test_normalize_severity(self):
        self.assertEqual(normalize_severity('CRITICAL'), 'critical')
        self.assertEqual(normalize_severity('moderate'), 'medium')
        self.assertEqual(normalize_severity(None), 'unknown')
        self.assertEqual(normalize_severity('bogus'), 'unknown')

    def test_strip_scheme(self):
        self.assertEqual(strip_scheme('https://example.com:443/path'), 'example.com')
        self.assertEqual(strip_scheme('example.com'), 'example.com')


class RunnerTests(TestCase):
    """Validate the execution-backend indirection without needing real tools."""

    def test_local_runner_executes_real_command(self):
        from recon.runtime.local import LocalRunner
        from recon.runtime.base import RunSpec
        runner = LocalRunner()
        # 'true' exists on any POSIX host; proves we actually shell out.
        self.assertTrue(runner.is_tool_available('true'))
        res = runner.run(RunSpec(argv=['echo', 'hi'], tool_name='echo',
                                 binary='echo', timeout=10))
        self.assertEqual(res.returncode, 0)
        self.assertEqual(res.stdout.strip(), 'hi')

    def test_local_runner_timeout(self):
        from recon.runtime.local import LocalRunner
        from recon.runtime.base import RunSpec
        res = LocalRunner().run(RunSpec(argv=['sleep', '5'], tool_name='sleep',
                                        binary='sleep', timeout=1))
        self.assertTrue(res.timed_out)

    def test_docker_runner_hardening_flags(self):
        """The assembled docker args must carry the sandbox hardening."""
        from recon.runtime.docker import DockerRunner
        from recon.runtime.base import RunSpec
        spec = RunSpec(argv=['nuclei', '-u', 'x'], tool_name='nuclei',
                       binary='nuclei', timeout=60, work_dir='/recon-work',
                       forward_env=['SUBFINDER_KEY'])
        args = DockerRunner()._base_run_args(spec)
        for flag in ['--rm', '--cap-drop', '--read-only', '--security-opt',
                     '--pids-limit', '--memory', '--network']:
            self.assertIn(flag, args, f"missing hardening flag {flag}")
        # work dir is bind-mounted at the same absolute path
        self.assertIn('/recon-work:/recon-work:rw', args)

    def test_backend_factory_selects_runner(self):
        import os
        from recon.runtime import get_runner, reset_runner_cache
        from recon.runtime.local import LocalRunner
        from recon.runtime.docker import DockerRunner
        old = os.environ.get('RECON_EXECUTION_BACKEND')
        try:
            os.environ['RECON_EXECUTION_BACKEND'] = 'docker'
            reset_runner_cache()
            self.assertIsInstance(get_runner(), DockerRunner)
            os.environ['RECON_EXECUTION_BACKEND'] = 'local'
            reset_runner_cache()
            self.assertIsInstance(get_runner(), LocalRunner)
        finally:
            if old is None:
                os.environ.pop('RECON_EXECUTION_BACKEND', None)
            else:
                os.environ['RECON_EXECUTION_BACKEND'] = old
            reset_runner_cache()

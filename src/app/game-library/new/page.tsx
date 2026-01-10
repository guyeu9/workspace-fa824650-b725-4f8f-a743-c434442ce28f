'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  coverUrl: z.string().url('封面图链接必须是合法 URL'),
  file: z
    .any()
    .refine((files) => files && files.length === 1, '必须上传一个 JSON 文件')
    .refine(
      (files) =>
        files &&
        files[0] &&
        typeof files[0].name === 'string' &&
        files[0].name.toLowerCase().endsWith('.json'),
      '只允许上传 .json 文件',
    ),
});

type FormValues = z.infer<typeof schema>;

export default function NewGamePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      coverUrl: '',
      file: undefined,
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (submitting) return;

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', values.title);
      if (values.description) {
        formData.append('description', values.description);
      }
      formData.append('coverUrl', values.coverUrl);
      const fileList = values.file as FileList;
      if (!fileList || fileList.length !== 1) {
        throw new Error('请选择 JSON 文件');
      }
      formData.append('file', fileList[0]);

      const res = await fetch('/api/games', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || '发布失败');
      }

      toast({
        title: '发布成功',
        description: '游戏已经发布到社区',
      });

      router.push('/game-library');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '发布失败，请稍后重试';
      toast({
        title: '发布失败',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-8 px-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>发布新游戏</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>游戏标题</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入游戏标题" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>游戏简介</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="简单介绍一下游戏内容"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coverUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>封面图链接</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="例如 https://example.com/cover.jpg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>游戏 JSON 文件</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".json,application/json"
                        onChange={(event) => field.onChange(event.target.files)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? '发布中...' : '发布游戏'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}


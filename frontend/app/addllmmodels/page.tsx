import AddDynamicLLMModelForm from "@/components/DynamicLLMModelAdd"
import AddStaticLLMModelForm from "@/components/StaticLLMModelAdd"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function TabsDemo() {
  return (
    <div className="flex justify-center">
      <Tabs defaultValue="dynamic" className="w-[600px] ">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dynamic">Dynamic</TabsTrigger>
          <TabsTrigger value="static">Static</TabsTrigger>
        </TabsList>
        <TabsContent value="dynamic" >
          <Card className=" rounded-b-xl">
            <CardHeader>
              <CardTitle>Dynamic Source Code Analysis</CardTitle>
              <CardDescription>
              Detecting unsafe funtions with custom test cases.
              </CardDescription>
            </CardHeader>
            <CardContent className="">
              <AddDynamicLLMModelForm />
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="static">
          <Card className="  rounded-b-xl">
            <CardHeader>
              <CardTitle>Static Source Code Analysis</CardTitle>
              <CardDescription>
                Detecting unsafe funtions with LLMs.
              </CardDescription>
            </CardHeader>
            <CardContent className="">
            <AddStaticLLMModelForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  )
}
